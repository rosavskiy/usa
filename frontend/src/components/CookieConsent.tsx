import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Проверяем согласился ли пользователь
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const rejectAll = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Privacy & Cookie Notice</h2>
              <p className="text-sm text-gray-600 mt-1">We care about your privacy</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>Carbon Tracker AI Assistant</strong> использует cookies и обрабатывает персональные данные 
              в соответствии с законами США, включая CCPA (California), CPRA, и другими штатами.
            </p>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <h3 className="font-bold text-gray-900 text-base">Какие данные мы собираем:</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Email адрес и название компании (для регистрации)</li>
              <li>Загруженные счета и документы (для анализа)</li>
              <li>Результаты расчетов выбросов CO₂</li>
              <li>Cookies для аутентификации и функционирования сайта</li>
              <li>IP адрес и данные браузера (логирование безопасности)</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">Как мы используем данные:</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Обработка счетов через AI (OpenAI API)</li>
              <li>Расчет углеродного следа вашей компании</li>
              <li>Генерация персонализированных рекомендаций</li>
              <li>Улучшение работы сервиса</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">Ваши права (CCPA/CPRA):</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Право знать:</strong> какие данные мы собираем</li>
              <li><strong>Право на удаление:</strong> запросить удаление ваших данных</li>
              <li><strong>Право отказаться:</strong> от продажи данных (мы НЕ продаем данные)</li>
              <li><strong>Право на доступ:</strong> получить копию ваших данных</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base mt-4">Соответствие законам:</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>CCPA:</strong> California Consumer Privacy Act</li>
              <li><strong>CPRA:</strong> California Privacy Rights Act</li>
              <li><strong>Virginia CDPA:</strong> Virginia Consumer Data Protection Act</li>
              <li><strong>Colorado CPA:</strong> Colorado Privacy Act</li>
              <li><strong>Connecticut CTDPA:</strong> Connecticut Data Privacy Act</li>
              <li><strong>Utah UCPA:</strong> Utah Consumer Privacy Act</li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
              <p className="text-sm text-green-900">
                <strong>✓ ПРОФЕССИОНАЛЬНЫЕ СТАНДАРТЫ:</strong> Наши расчеты соответствуют GHG Protocol, EPA Emission Factors, 
                ISO 14064-1. Подходят для официальной отчетности в CDP, SEC Climate Disclosure, GRI Standards. 
                AI парсинг с точностью 95%+ на качественных документах.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded mt-4">
              <p className="text-xs text-gray-600">
                Используя наш сервис, вы соглашаетесь с обработкой данных как описано выше. 
                Мы применяем шифрование, безопасное хранение и регулярные аудиты безопасности. 
                Данные не передаются третьим лицам, кроме OpenAI для AI обработки (согласно их 
                <a href="https://openai.com/privacy" target="_blank" className="text-blue-600 hover:underline"> Privacy Policy</a>).
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Для вопросов о конфиденциальности: <strong>privacy@carbontracker.ai</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
          <button
            onClick={rejectAll}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={acceptAll}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Accept & Continue
          </button>
        </div>

        <div className="px-6 pb-4 text-center">
          <a 
            href="/privacy-policy" 
            target="_blank" 
            className="text-xs text-blue-600 hover:underline"
          >
            Read Full Privacy Policy
          </a>
          {' | '}
          <a 
            href="/terms-of-service" 
            target="_blank" 
            className="text-xs text-blue-600 hover:underline"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
