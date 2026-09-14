import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Share2, X } from 'lucide-react';
import { useFriendsQuery } from '../../lib/queries/friendQueries';

interface ShareQuizModalProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function ShareQuizModal({ quizId, quizTitle, onClose }: ShareQuizModalProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { data: friends = [], isLoading: loadingFriends } = useFriendsQuery(profile?.id);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const shareQuiz = async () => {
    if (!profile || selectedFriends.length === 0) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const shares = selectedFriends.map(friendId => ({
        quiz_id: quizId,
        shared_by_user_id: profile.id,
        shared_with_user_id: friendId,
      }));

      const { error } = await supabase
        .from('quiz_shares')
        .upsert(shares, { onConflict: 'quiz_id,shared_with_user_id', ignoreDuplicates: true });

      if (error) {
        setErrorMessage(t("share.error"));
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-quiz-modal-title"
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="share-quiz-modal-title" className="text-2xl font-bold text-gray-800 flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-emerald-600" aria-hidden="true" />
            {t('share.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('share.success')}</h3>
            <p className="text-gray-600">{t('share.successMessage')}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              {t('share.shareWith').replace('{title}', quizTitle)}
            </p>

            {loadingFriends ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('friends.noFriends')}</p>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto mb-6 space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedFriends.includes(friend.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{friend.pseudo}</p>
                          <p className="text-sm text-gray-600">{t('profile.level')} {friend.level}</p>
                        </div>
                        {selectedFriends.includes(friend.id) && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={shareQuiz}
                    disabled={selectedFriends.length === 0 || loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('share.sharing') : `${t('quiz.share')} (${selectedFriends.length})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
