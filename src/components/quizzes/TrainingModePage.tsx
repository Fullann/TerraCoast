import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dumbbell, ArrowLeft, Play, Search, X } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface TrainingModePageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function TrainingModePage({ onNavigate }: TrainingModePageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(50);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<'all' | 'popular' | 'short'>('all');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .or('is_public.eq.true,is_global.eq.true')
      .order('total_plays', { ascending: false });

    if (data) {
      setQuizzes(data);
    }
    setLoading(false);
  };

  const handleQuizSelection = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);

    const quizQuestionCount = count || 10;
    setMaxQuestions(quizQuestionCount);
    setQuestionCount(Math.min(10, quizQuestionCount));
  };

  const startTraining = () => {
    if (!selectedQuiz) return;

    onNavigate('play-training', {
      quizId: selectedQuiz.id,
      questionCount: questionCount,
    });
  };

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const categoryCounts = quizzes.reduce<Record<string, number>>((acc, quiz) => {
    if (!quiz.category) return acc;
    acc[quiz.category] = (acc[quiz.category] || 0) + 1;
    return acc;
  }, {});

  const topCategoryFilters = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category]) => category);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const searchable = [
      quiz.title,
      quiz.description || '',
      quiz.category || '',
      quiz.difficulty || '',
      Array.isArray(quiz.tags) ? quiz.tags.join(' ') : '',
    ]
      .join(' ')
      .toLowerCase();

    const matchesQuery =
      queryTokens.length === 0 ||
      queryTokens.every((token) => searchable.includes(token));

    const matchesMode =
      searchMode === 'all' ||
      (searchMode === 'popular' && (quiz.total_plays || 0) >= 20) ||
      (searchMode === 'short' && (quiz.time_limit_seconds || 30) <= 20);

    return matchesQuery && matchesMode;
  });

  const estimatedMinutes = selectedQuiz
    ? Math.max(
        1,
        Math.ceil(
          (questionCount * Math.max(10, selectedQuiz.time_limit_seconds || 30)) / 60
        )
      )
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.back')}
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Dumbbell className="w-10 h-10 mr-3 text-emerald-600" />
          {t('training.title')}
        </h1>
        <p className="text-gray-600">
          {t('training.subtitle')}
        </p>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4">{t('training.features')}</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            {t('training.feature1')}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            {t('training.feature2')}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            {t('training.feature3')}
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            {t('training.feature4')}
          </li>
        </ul>
      </div>

      {!selectedQuiz && quizzes.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-purple-900 mb-1">
            {t("training.quickStartTitle")}
          </p>
          <p className="text-sm text-purple-700 mb-3">
            {t("training.quickStartHint")}
          </p>
          <button
            type="button"
            onClick={() => handleQuizSelection(quizzes[0])}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {t("training.pickPopularQuiz")}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t('training.step1')}
        </h2>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('training.searchQuiz')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredQuizzes.length > 0) {
                handleQuizSelection(filteredQuizzes[0]);
              }
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
          {searchTerm.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
              aria-label={t('training.clearSearch')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">{t('training.searchHint')}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setSearchMode('all')}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchMode === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {t('training.filterAll')}
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('popular')}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchMode === 'popular'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {t('training.filterPopular')}
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('short')}
            className={`px-3 py-1.5 text-xs rounded-full border ${
              searchMode === 'short'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {t('training.filterShort')}
          </button>
        </div>

        {topCategoryFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {topCategoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSearchTerm(category)}
                className="px-2.5 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                #{category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="text-xs text-gray-500 pb-1">
              {filteredQuizzes.length} {t('training.resultsCount')}
            </div>
            {filteredQuizzes.length === 0 && (
              <div className="text-sm text-gray-500 py-4 text-center">
                {t("training.noQuizResult")}
              </div>
            )}
            {filteredQuizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => handleQuizSelection(quiz)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedQuiz?.id === quiz.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-600">{quiz.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {quiz.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {quiz.total_plays} {t('training.games')}
                      </span>
                    </div>
                  </div>
                  {selectedQuiz?.id === quiz.id && (
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedQuiz && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('training.step2')}
          </h2>

          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-800">{selectedQuiz.title}</p>
            <p className="text-xs text-emerald-700 mt-1">
              {t("training.estimatedDuration")} ~{estimatedMinutes} min
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[5, 10, 20, maxQuestions].filter((v, i, arr) => arr.indexOf(v) === i).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuestionCount(Math.min(value, maxQuestions))}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  questionCount === Math.min(value, maxQuestions)
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
                }`}
              >
                {value} {t("training.questions")}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="1"
              max={maxQuestions}
              step="1"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="text-center min-w-[60px]">
              <span className="text-3xl font-bold text-emerald-600">{questionCount}</span>
              <p className="text-xs text-gray-600">{t('training.questions')}</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1 {t('training.questions')}</span>
            <span>{maxQuestions} {t('training.questions')} ({t('training.max')})</span>
          </div>
        </div>
      )}

      <button
        onClick={startTraining}
        disabled={!selectedQuiz}
        className="w-full py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Play className="w-6 h-6 mr-2" />
        {selectedQuiz ? t('training.start') : t("training.selectQuizFirst")}
      </button>
    </div>
  );
}
