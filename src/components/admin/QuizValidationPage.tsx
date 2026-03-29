import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type QuestionRow = Database['public']['Tables']['questions']['Row'];

interface QuizWithAuthor extends Quiz {
  author?: Profile;
  question_count?: number;
}

function extractQuestionOptions(rawOptions: QuestionRow['options']): string[] {
  if (!rawOptions) return [];

  const toCleanStrings = (values: unknown[]): string[] =>
    values
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);

  if (Array.isArray(rawOptions)) {
    return toCleanStrings(rawOptions);
  }

  if (typeof rawOptions === 'object') {
    const record = rawOptions as Record<string, unknown>;
    const candidates = ['options', 'choices', 'answers', 'propositions'];

    for (const key of candidates) {
      const value = record[key];
      if (Array.isArray(value)) {
        const parsed = toCleanStrings(value);
        if (parsed.length > 0) return parsed;
      }
    }

    return toCleanStrings(Object.values(record));
  }

  return [];
}

function renderQuestionConfig(question: QuestionRow, t: (key: string) => string) {
  const mapData = (question.map_data || {}) as Record<string, any>;
  const selectedCountries = Array.isArray(mapData.selectedCountries)
    ? mapData.selectedCountries
    : [];
  const top10ExpectedOrder = Array.isArray(question.options)
    ? (question.options as unknown[])
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : [];

  if (question.question_type === "puzzle_map") {
    return (
      <div className="mt-2 text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded p-2">
        {t('admin.quizValidation.puzzle.modeLabel')}{" "}
        {selectedCountries.length > 0
          ? `${selectedCountries.length} ${t('admin.quizValidation.puzzle.selectedCountries')}`
          : `${t('admin.quizValidation.puzzle.zone')} ${mapData.continent || "world"}`}
      </div>
    );
  }

  if (question.question_type === "top10_order") {
    return (
      <div className="mt-2 text-xs text-orange-800 bg-orange-50 border border-orange-200 rounded p-2 space-y-2">
        <p>
          {t('admin.quizValidation.top10.modeLabel')}{" "}
          {top10ExpectedOrder.length > 0
            ? t('admin.quizValidation.top10.customList')
            : `${t('admin.quizValidation.top10.metric')} ${mapData.metric || "population"}`}
          {selectedCountries.length > 0
            ? ` • ${selectedCountries.length} ${t('admin.quizValidation.puzzle.selectedCountries')}`
            : top10ExpectedOrder.length > 0
            ? ""
            : ` • ${t('admin.quizValidation.puzzle.zone')} ${mapData.continent || "world"}`}
        </p>
        {top10ExpectedOrder.length > 0 && (
          <div className="bg-white border border-orange-200 rounded p-2">
            <p className="font-semibold text-orange-900 mb-1">
              {t('admin.quizValidation.top10.expectedOrder')}:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-orange-900">
              {top10ExpectedOrder.map((item, index) => (
                <li key={`top10-expected-${index}`}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function QuizValidationPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [pendingQuizzes, setPendingQuizzes] = useState<QuizWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithAuthor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuestionRow[]>>({});
  const [loadingQuestionsFor, setLoadingQuestionsFor] = useState<string | null>(null);
  const [locationLat, setLocationLat] = useState<string>('');
  const [locationLng, setLocationLng] = useState<string>('');

  useEffect(() => {
    loadPendingQuizzes();
  }, []);

  const loadPendingQuizzes = async () => {
    setLoading(true);
   const { data: quizzes, error } = await supabase
  .from('quizzes')
  .select('*, author:profiles!quizzes_creator_id_fkey(*)')
  .eq('pending_validation', true)
  .eq('validation_status', 'pending')
  .order('created_at', { ascending: false });


    if (quizzes) {
      const quizzesWithCounts = await Promise.all(
        quizzes.map(async (quiz: any) => {
          const { count, error: countError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id);

          return {
            ...quiz,
            // Si RLS bloque le count, on évite d'afficher un faux 0.
            question_count: countError ? undefined : (count || 0),
          };
        })
      );

      setPendingQuizzes(quizzesWithCounts);
    }
    setLoading(false);
  };

  const loadQuizQuestions = async (quizId: string) => {
    setLoadingQuestionsFor(quizId);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setQuizQuestions((prev) => ({ ...prev, [quizId]: data as QuestionRow[] }));
    } else {
      setQuizQuestions((prev) => ({ ...prev, [quizId]: [] }));
    }
    setLoadingQuestionsFor(null);
  };

  const approveQuiz = async (quizId: string) => {
    const parsedLat = locationLat.trim() === '' ? null : Number(locationLat);
    const parsedLng = locationLng.trim() === '' ? null : Number(locationLng);
    if (
      (locationLat.trim() !== '' && (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90)) ||
      (locationLng.trim() !== '' && (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180))
    ) {
      alert('Coordonnées invalides. Lat: -90..90, Lng: -180..180');
      return;
    }

    const { error: quizError } = await supabase
      .from('quizzes')
      .update({
        is_public: true,
        validation_status: 'approved',
        pending_validation: false,
        location_lat: parsedLat,
        location_lng: parsedLng,
      })
      .eq('id', quizId);

    if (!quizError) {
      await supabase
        .from('quiz_validations')
        .insert({
          quiz_id: quizId,
          validated_by: profile?.id,
          status: 'approved',
        });

      const quiz = pendingQuizzes.find(q => q.id === quizId);
      if (quiz?.author_id) {
        const { data: author } = await supabase
          .from('profiles')
          .select('published_quiz_count')
          .eq('id', quiz.author_id)
          .single();

        if (author) {
          await supabase
            .from('profiles')
            .update({
              published_quiz_count: (author.published_quiz_count || 0) + 1,
            })
            .eq('id', quiz.author_id);
        }
      }

      await loadPendingQuizzes();
      setSelectedQuiz(null);
      setLocationLat('');
      setLocationLng('');
    }
  };

  const rejectQuiz = async (quizId: string) => {
    if (!rejectionReason.trim()) {
      alert('Merci de fournir une raison pour le rejet');
      return;
    }

    const { error: quizError } = await supabase
      .from('quizzes')
      .update({
        validation_status: 'rejected',
        pending_validation: false,
      })
      .eq('id', quizId);

    if (!quizError) {
      await supabase
        .from('quiz_validations')
        .insert({
          quiz_id: quizId,
          validated_by: profile?.id,
          status: 'rejected',
          rejection_reason: rejectionReason,
        });

      await loadPendingQuizzes();
      setSelectedQuiz(null);
      setRejectionReason('');
      setLocationLat('');
      setLocationLng('');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent valider les quiz</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Clock className="w-10 h-10 mr-3 text-blue-600" />
          Validation des Quiz
        </h1>
        <p className="text-gray-600">Valide les quiz avant leur publication</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : pendingQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun quiz en attente</h3>
          <p className="text-gray-500">Tous les quiz ont été validés</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description || 'Pas de description'}</p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {quiz.question_count ?? '?'} questions
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {quiz.category}
                    </span>
                    <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                      {quiz.difficulty}
                    </span>
                    {quiz.author && (
                      <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                        Par {quiz.author.pseudo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedQuiz?.id === quiz.id ? (
                <div className="border-t pt-4 mt-4">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      Questions du quiz
                    </h4>
                    {loadingQuestionsFor === quiz.id ? (
                      <p className="text-sm text-gray-500">Chargement des questions...</p>
                    ) : (quizQuestions[quiz.id]?.length || 0) === 0 ? (
                      <p className="text-sm text-red-600">
                        Aucune question accessible pour ce quiz.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {quizQuestions[quiz.id].map((question, index) => (
                          <div key={question.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-gray-700">
                                Question {index + 1}
                              </p>
                              <span className="text-xs bg-white border border-gray-300 rounded-full px-2 py-0.5 text-gray-600">
                                {question.question_type}
                              </span>
                            </div>
                            <p className="text-gray-800">{question.question_text}</p>
                            {renderQuestionConfig(question, t)}
                            {(() => {
                              const options = extractQuestionOptions(question.options);
                              const normalizedCorrectAnswer = (question.correct_answer || '')
                                .trim()
                                .toLowerCase();

                              if (options.length === 0) return null;

                              return (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                                    Propositions
                                  </p>
                                  <ul className="space-y-1">
                                    {options.map((option, optionIndex) => {
                                      const isCorrect =
                                        option.trim().toLowerCase() === normalizedCorrectAnswer;
                                      return (
                                        <li
                                          key={`${question.id}-option-${optionIndex}`}
                                          className={`text-sm px-2 py-1 rounded ${
                                            isCorrect
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                              : 'bg-white text-gray-700 border border-gray-200'
                                          }`}
                                        >
                                          {option}
                                          {isCorrect && (
                                            <span className="ml-2 text-xs font-semibold">
                                              (bonne réponse)
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })()}
                            <p className="text-sm text-emerald-700 mt-1">
                              Réponse attendue: <span className="font-medium">{question.correct_answer}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet (optionnel pour approbation)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows={3}
                      placeholder="Explique pourquoi ce quiz est rejeté..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation du quiz (admin, optionnel)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="0.0001"
                        min={-90}
                        max={90}
                        value={locationLat}
                        onChange={(e) => setLocationLat(e.target.value)}
                        placeholder="Latitude (ex: 46.2044)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <input
                        type="number"
                        step="0.0001"
                        min={-180}
                        max={180}
                        value={locationLng}
                        onChange={(e) => setLocationLng(e.target.value)}
                        placeholder="Longitude (ex: 6.1432)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Ces coordonnées seront utilisées sur le globe d’accueil.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedQuiz(null);
                        setRejectionReason('');
                        setLocationLat('');
                        setLocationLng('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => rejectQuiz(quiz.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => approveQuiz(quiz.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approuver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setSelectedQuiz(quiz);
                    setLocationLat(
                      quiz.location_lat != null ? String(quiz.location_lat) : ''
                    );
                    setLocationLng(
                      quiz.location_lng != null ? String(quiz.location_lng) : ''
                    );
                    if (!quizQuestions[quiz.id]) {
                      await loadQuizQuestions(quiz.id);
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Examiner et valider
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
