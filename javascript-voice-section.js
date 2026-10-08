/**
 * NOVA AI - Advanced Web Speech API Voice Transcription & Multilingual Translation Module
 * File: javascript-voice-section.js
 * 
 * Encompasses:
 * 1. MULTILINGUAL DICTIONARY & UI TRANSLATION (15 Languages: Urdu, English, Hindi, Arabic, etc.)
 * 2. MICROPHONE STATE MANAGER (ON/OFF toggles, Permission Checks, Visual Feedback)
 * 3. WEB SPEECH API STT ENGINE (Robust speech-to-text with proper 'aborted' error handling)
 * 4. DYNAMIC DOM INJECTION (Auto-injects Microphone panel in settings on load)
 */

// ============================================================================
// 1. MULTILINGUAL UI DICTIONARY (15 LANGUAGES)
// ============================================================================
var APP_TRANSLATIONS = {
  'ur-PK': {
    brandName: "نووا اے آئی (NOVA AI)",
    placeholder: "نووا سے کچھ بھی پوچھیں...",
    intro_desc: "اردو، ہندی یا انگریزی میں پوچھیں۔ اسکرین شاٹس اینالائز کریں، کوڈ ریویو کریں، اور وائرل ویڈیوز بنائیں۔",
    lbl_active_model: "🤖 فعال اے آئی ماڈل (AI Model):",
    lbl_api_key: "🔑 گوگل اے آئی اسٹوڈیو اے پی آئی کی (API Key):",
    lbl_mic_lang: "🎙️ مائیکروفون کی زبان (Mic Language):",
    lbl_speech_rate: "🗣️ آواز کی رفتار (Speech Rate):",
    btn_home_page: "ہوم پیج (Home Page)",
    btn_new_chat: "نیا چیٹ (New Chat)",
    btn_history: "چیٹ ہسٹری (History)",
    btn_settings: "سیٹنگز (Settings)",
    btn_photo_studio: "🎨 فوٹو اسٹوڈیو اور ایڈیٹر",
    btn_voice_tool: "🎤 وائس ٹو ٹیکسٹ ٹول (اردو)",
    btn_video_gen: "🎬 ویڈیو جنریشن (Video)",
    lbl_theme: "◐ ڈارک / لائٹ تھیم",
    lbl_voice_test: "🔊 آواز کا ٹیسٹ",
    btn_install_pwa: "📲 نووا ایپ انسٹال کریں (PWA)",
    suggestion_screen: "🔍 اسکرین کا تجزیہ",
    suggestion_video: "🎬 ویڈیو ایڈیٹنگ",
    suggestion_bg: "🖼️ پس منظر کی تلاش",
    suggestion_code: "📝 کوڈ لکھنا",
    offline_banner: "⚡ آف لائن موڈ — آپ آف لائن ہیں۔ محفوظ شدہ ہسٹری دستیاب ہے۔",
    history_title: "🕒 گفتگو کی ہسٹری (Chat History)",
    settings_title: "⚙️ ایپ سیٹنگز (Settings)",
    voice_tool_title: "🎤 اردو وائس ٹو ٹیکسٹ ٹول",
    mic_status_lbl: "🎙️ مائیکروفون سیٹنگز (Microphone Settings):",
    mic_status_active: "فعال اور تیار (Active)",
    mic_status_inactive: "بند (Disabled)",
    btn_check_mic: "📋 اجازت چیک کریں",
    btn_enable_mic: "🎤 مائیکروفون چالو کریں",
    alert_mic_disabled: "⚠️ مائیکروفون سیٹنگز سے بند ہے! براہ کرم سیٹنگز میں جا کر اسے ON کریں۔",
    alert_mic_denied: "⚠️ مائیکروفون کی اجازت مسترد ہے! براہ کرم براؤزر کی سیٹنگز سے مائیکروفون چالو کریں۔",
    speech_rate_value: "رفتار:"
  },
  'en-US': {
    brandName: "NOVA AI",
    placeholder: "Ask NOVA anything...",
    intro_desc: "Ask in Urdu, Hindi, or English. Analyze screenshots, review code, and generate viral videos.",
    lbl_active_model: "🤖 Active AI Model:",
    lbl_api_key: "🔑 Google AI Studio API Key:",
    lbl_mic_lang: "🎙️ Microphone Language:",
    lbl_speech_rate: "🗣️ Speech Synthesis Rate:",
    btn_home_page: "Home Page",
    btn_new_chat: "New Chat",
    btn_history: "Chat History",
    btn_settings: "Settings",
    btn_photo_studio: "🎨 AI Photo Studio & Editor",
    btn_voice_tool: "🎤 Voice to Text Tool (Urdu)",
    btn_video_gen: "🎬 Video Generation",
    lbl_theme: "◐ Dark / Light Theme",
    lbl_voice_test: "🔊 Speaker Voice Test",
    btn_install_pwa: "📲 Install NOVA AI App (PWA)",
    suggestion_screen: "🔍 Screen Analysis",
    suggestion_video: "🎬 Video Editing",
    suggestion_bg: "🖼️ Background Search",
    suggestion_code: "📝 Code Writing",
    offline_banner: "⚡ Offline Mode — You are offline. Saved history is available.",
    history_title: "🕒 Conversation History",
    settings_title: "⚙️ App Settings",
    voice_tool_title: "🎤 Urdu Voice to Text Tool",
    mic_status_lbl: "🎙️ Microphone Settings:",
    mic_status_active: "Active & Ready",
    mic_status_inactive: "Disabled",
    btn_check_mic: "📋 Check Permission",
    btn_enable_mic: "🎤 Enable Microphone",
    alert_mic_disabled: "⚠️ Microphone is disabled in Settings! Please turn it ON first.",
    alert_mic_denied: "⚠️ Microphone permission denied! Please allow access in browser settings.",
    speech_rate_value: "Rate:"
  },
  'hi-IN': {
    brandName: "नोवा एआई (NOVA AI)",
    placeholder: "NOVA से कुछ भी पूछें...",
    intro_desc: "उर्दू, हिंदी या अंग्रेजी में पूछें। स्क्रीनशॉट का विश्लेषण करें, कोड की समीक्षा करें और वायरल वीडियो बनाएं।",
    lbl_active_model: "🤖 सक्रिय एआई मॉडल:",
    lbl_api_key: "🔑 गूगल एआई स्टूडियो एपीआई कुंजी:",
    lbl_mic_lang: "🎙️ माइक्रोफ़ोन की भाषा:",
    lbl_speech_rate: "🗣️ भाषण संश्लेषण दर:",
    btn_home_page: "होम पेज",
    btn_new_chat: "नया चैट",
    btn_history: "चैट इतिहास",
    btn_settings: "सेटिंग्स",
    btn_photo_studio: "🎨 एआई फोटो स्टूडियो और संपादक",
    btn_voice_tool: "🎤 आवाज से पाठ उपकरण (उर्दू)",
    btn_video_gen: "🎬 वीडियो जनरेशन",
    lbl_theme: "◐ डार्क / लाइट थीम",
    lbl_voice_test: "🔊 वॉयस टेस्ट",
    btn_install_pwa: "📲 नोवा एआई ऐप इंस्टॉल करें (PWA)",
    suggestion_screen: "🔍 स्क्रीन विश्लेषण",
    suggestion_video: "🎬 वीडियो संपादन",
    suggestion_bg: "🖼️ पृष्ठभूमि खोज",
    suggestion_code: "📝 कोड लेखन",
    offline_banner: "⚡ ऑफ़लाइन मोड — आप ऑफ़लाइन हैं। सहेजा गया इतिहास उपलब्ध है।",
    history_title: "🕒 बातचीत का इतिहास",
    settings_title: "⚙️ ऐप सेटिंग्स",
    voice_tool_title: "🎤 उर्दू वॉयस टू टेक्स्ट टूल",
    mic_status_lbl: "🎙️ माइक्रोफ़ोन सेटिंग्स:",
    mic_status_active: "सक्रिय और तैयार (Active)",
    mic_status_inactive: "अक्षम (Disabled)",
    btn_check_mic: "📋 अनुमति जांचें",
    btn_enable_mic: "🎤 माइक्रोफ़ोन सक्षम करें",
    alert_mic_disabled: "⚠️ माइक्रोफ़ोन सेटिंग्स में अक्षम है! कृपया सेटिंग्स में जाकर इसे चालू करें।",
    alert_mic_denied: "⚠️ माइक्रोफ़ोन की अनुमति अस्वीकृत है! कृपया ब्राउज़र सेटिंग्स में अनुमति दें।"
  },
  'ar-SA': {
    brandName: "نوفا ذكاء اصطناعي (NOVA AI)",
    placeholder: "اسأل نوفا عن أي شيء...",
    intro_desc: "اسأل باللغة الأردية أو الهندية أو الإنجليزية. قم بتحليل لقطات الشاشة ومراجعة الأكواد وإنشاء مقاطع فيديو فريدة.",
    lbl_active_model: "🤖 نموذج الذكاء الاصطناعي النشط:",
    lbl_api_key: "🔑 مفتاح واجهة برمجة تطبيقات Google:",
    lbl_mic_lang: "🎙️ لغة الميكروفون:",
    lbl_speech_rate: "🗣️ معدل توليد الكلام:",
    btn_home_page: "الصفحة الرئيسية",
    btn_new_chat: "دردشة جديدة",
    btn_history: "سجل الدردشة",
    btn_settings: "الإعدادات",
    btn_photo_studio: "🎨 استوديو ومحرر الصور بالذكاء الاصطناعي",
    btn_voice_tool: "🎤 أداة تحويل الصوت إلى نص (الأردية)",
    btn_video_gen: "🎬 توليد الفيديو",
    lbl_theme: "◐ المظهر الداكن / الفاتح",
    lbl_voice_test: "🔊 اختبار الصوت",
    btn_install_pwa: "📲 تثبيت تطبيق نوفا (PWA)",
    suggestion_screen: "🔍 تحليل الشاشة",
    suggestion_video: "🎬 تحرير الفيديو",
    suggestion_bg: "🖼️ البحث عن الخلفية",
    suggestion_code: "📝 كتابة الأكواد",
    offline_banner: "⚡ وضع عدم الاتصال — أنت غير متصل بالإنترنت. السجل المحفوظ متاح.",
    history_title: "🕒 سجل المحادثات",
    settings_title: "⚙️ إعدادات التطبيق",
    voice_tool_title: "🎤 أداة تحويل الصوت إلى نص للأردية",
    mic_status_lbl: "🎙️ إعدادات الميكروفون:",
    mic_status_active: "نشط وجاهز",
    mic_status_inactive: "معطل",
    btn_check_mic: "📋 التحقق من الإذن",
    btn_enable_mic: "🎤 تمكين الميكروفون",
    alert_mic_disabled: "⚠️ الميكروفون معطل في الإعدادات! يرجى تشغيله أولاً.",
    alert_mic_denied: "⚠️ تم رفض إذن الميكروفون! يرجى السماح بالوصول في إعدادات المتصفح."
  },
  'zh-CN': {
    brandName: "NOVA 智能助理 (NOVA AI)",
    placeholder: "向 NOVA 提问任何问题...",
    intro_desc: "支持乌尔都语、印地语或英语提问。分析截图、审查代码并生成热门视频。",
    lbl_active_model: "🤖 活跃 AI 模型:",
    lbl_api_key: "🔑 Google AI Studio 密钥:",
    lbl_mic_lang: "🎙️ 麦克风语言:",
    lbl_speech_rate: "🗣️ 语音合成速率:",
    btn_home_page: "主页",
    btn_new_chat: "新建聊天",
    btn_history: "历史记录",
    btn_settings: "设置",
    btn_photo_studio: "🎨 AI 照片工作室与编辑器",
    btn_voice_tool: "🎤 语音转文字工具",
    btn_video_gen: "🎬 视频生成",
    lbl_theme: "◐ 深色 / 浅色主题",
    lbl_voice_test: "🔊 扬声器测试",
    btn_install_pwa: "📲 安装 NOVA 应用 (PWA)",
    suggestion_screen: "🔍 屏幕分析",
    suggestion_video: "🎬 视频编辑",
    suggestion_bg: "🖼️ 背景搜索",
    suggestion_code: "📝 代码编写",
    offline_banner: "⚡ 离线模式 — 您已断开网络连接。可以使用本地历史记录。",
    history_title: "🕒 对话历史记录",
    settings_title: "⚙️ 应用设置",
    voice_tool_title: "🎤 乌尔都语语音转文字工具",
    mic_status_lbl: "🎙️ 麦克风设置:",
    mic_status_active: "活跃并就绪",
    mic_status_inactive: "已禁用",
    btn_check_mic: "📋 检查权限",
    btn_enable_mic: "🎤 启用麦克风",
    alert_mic_disabled: "⚠️ 麦克风在设置中已被禁用！请先开启。",
    alert_mic_denied: "⚠️ 麦克风权限被拒绝！请在浏览器设置中允许访问。"
  },
  'ja-JP': {
    brandName: "NOVA AI",
    placeholder: "NOVAに何でも聞いてください...",
    intro_desc: "ウルドゥー語、ヒンディー語、または英語で質問できます。スクリーンショットの分析、コードレビュー、動画生成に対応。",
    lbl_active_model: "🤖 有効なAIモデル:",
    lbl_api_key: "🔑 Google AI Studio APIキー:",
    lbl_mic_lang: "🎙️ マイク言語:",
    lbl_speech_rate: "🗣️ 音声合成速度:",
    btn_home_page: "ホームページ",
    btn_new_chat: "新規チャット",
    btn_history: "履歴",
    btn_settings: "設定",
    btn_photo_studio: "🎨 AIフォトスタジオ＆エディター",
    btn_voice_tool: "🎤 音声文字起こしツール",
    btn_video_gen: "🎬 動画生成",
    lbl_theme: "◐ ダーク / ライトテーマ",
    lbl_voice_test: "🔊 音声テスト",
    btn_install_pwa: "📲 NOVAアプリをインストール (PWA)",
    suggestion_screen: "🔍 画面分析",
    suggestion_video: "🎬 動画編集",
    suggestion_bg: "🖼️ 背景検索",
    suggestion_code: "📝 代码作成",
    offline_banner: "⚡ オフラインモード — オフラインです。保存された履歴が利用可能です。",
    history_title: "🕒 会話履歴",
    settings_title: "⚙️ アプリ設定",
    voice_tool_title: "🎤 音声文字起こしツール",
    mic_status_lbl: "🎙️ マイク設定:",
    mic_status_active: "有効で準備完了",
    mic_status_inactive: "無効",
    btn_check_mic: "📋 権限を確認",
    btn_enable_mic: "🎤 マイクを有効化",
    alert_mic_disabled: "⚠️ 設定でマイクがオフになっています！オンにしてください。",
    alert_mic_denied: "⚠️ マイクのアクセス権限が拒否されました！ブラウザ設定で許可してください。"
  },
  'es-ES': {
    brandName: "NOVA AI",
    placeholder: "Pregúntale a NOVA lo que sea...",
    intro_desc: "Pregunta en urdu, hindi o inglés. Analiza capturas de pantalla, revisa código y genera videos virales.",
    lbl_active_model: "🤖 Modelo de IA activo:",
    lbl_api_key: "🔑 Clave API de Google AI Studio:",
    lbl_mic_lang: "🎙️ Idioma del micrófono:",
    lbl_speech_rate: "🗣️ Velocidad de síntesis de voz:",
    btn_home_page: "Inicio",
    btn_new_chat: "Nuevo chat",
    btn_history: "Historial",
    btn_settings: "Ajustes",
    btn_photo_studio: "🎨 Estudio y Editor de Fotos AI",
    btn_voice_tool: "🎤 Herramienta de voz a texto",
    btn_video_gen: "🎬 Generación de video",
    lbl_theme: "◐ Tema Oscuro / Claro",
    lbl_voice_test: "🔊 Prueba de sonido",
    btn_install_pwa: "📲 Instalar aplicación NOVA (PWA)",
    suggestion_screen: "🔍 Análisis de pantalla",
    suggestion_video: "🎬 Edición de video",
    suggestion_bg: "🖼️ Búsqueda de fondo",
    suggestion_code: "📝 Escritura de código",
    offline_banner: "⚡ Modo sin conexión — Está desconectado. Historial guardado disponible.",
    history_title: "🕒 Historial de conversaciones",
    settings_title: "⚙️ Ajustes de la aplicación",
    voice_tool_title: "🎤 Herramienta de voz a texto",
    mic_status_lbl: "🎙️ Configuración del micrófono:",
    mic_status_active: "Activo y listo",
    mic_status_inactive: "Deshabilitado",
    btn_check_mic: "📋 Verificar permiso",
    btn_enable_mic: "🎤 Habilitar micrófono",
    alert_mic_disabled: "⚠️ ¡El micrófono está deshabilitado en Ajustes! Por favor, actívelo.",
    alert_mic_denied: "⚠️ ¡Permiso de micrófono denegado! Por favor permítalo en la configuración de su navegador."
  },
  'fr-FR': {
    brandName: "NOVA AI",
    placeholder: "Demandez n'importe quoi à NOVA...",
    intro_desc: "Posez vos questions en ourdou, hindi ou anglais. Analysez les captures d'écran, révisez le code et créez des vidéos virales.",
    lbl_active_model: "🤖 Modèle IA actif:",
    lbl_api_key: "🔑 Clé API Google AI Studio:",
    lbl_mic_lang: "🎙️ Langue du micro:",
    lbl_speech_rate: "🗣️ Vitesse de parole:",
    btn_home_page: "Page d'accueil",
    btn_new_chat: "Nouveau chat",
    btn_history: "Historique",
    btn_settings: "Paramètres",
    btn_photo_studio: "🎨 AI Photo Studio & Éditeur",
    btn_voice_tool: "🎤 Outil voix-texte (Urdu)",
    btn_video_gen: "🎬 Génération de vidéo",
    lbl_theme: "◐ Thème sombre / clair",
    lbl_voice_test: "🔊 Test du haut-parleur",
    btn_install_pwa: "📲 Installer l'application NOVA (PWA)",
    suggestion_screen: "🔍 Analyse d'écran",
    suggestion_video: "🎬 Montage vidéo",
    suggestion_bg: "🖼️ Recherche d'arrière-plan",
    suggestion_code: "📝 Écriture de code",
    offline_banner: "⚡ Mode hors ligne — Vous êtes hors ligne. Historique disponible.",
    history_title: "🕒 Historique des discussions",
    settings_title: "⚙️ Paramètres de l'application",
    voice_tool_title: "🎤 Outil voix-texte",
    mic_status_lbl: "🎙️ Paramètres du micro:",
    mic_status_active: "Actif & Prêt",
    mic_status_inactive: "Désactivé",
    btn_check_mic: "📋 Vérifier les permissions",
    btn_enable_mic: "🎤 Activer le microphone",
    alert_mic_disabled: "⚠️ Le microphone est désactivé dans les Paramètres ! Veuillez l'activer.",
    alert_mic_denied: "⚠️ Autorisation du microphone refusée ! Veuillez l'autoriser dans les paramètres du navigateur."
  },
  'de-DE': {
    brandName: "NOVA AI",
    placeholder: "Frage NOVA alles, was du willst...",
    intro_desc: "Fragen Sie auf Urdu, Hindi oder Englisch. Analysieren Sie Screenshots, überprüfen Sie Code und erstellen Sie virale Videos.",
    lbl_active_model: "🤖 Aktives KI-Modell:",
    lbl_api_key: "🔑 Google AI Studio API-Schlüssel:",
    lbl_mic_lang: "🎙️ Mikrofonsprache:",
    lbl_speech_rate: "🗣️ Sprachgeschwindigkeit:",
    btn_home_page: "Startseite",
    btn_new_chat: "Neuer Chat",
    btn_history: "Chat-Verlauf",
    btn_settings: "Einstellungen",
    btn_photo_studio: "🎨 AI Fotostudio & Editor",
    btn_voice_tool: "🎤 Sprache-zu-Text-Tool",
    btn_video_gen: "🎬 Video-Erstellung",
    lbl_theme: "◐ Dunkles / Helles Design",
    lbl_voice_test: "🔊 Tontest",
    btn_install_pwa: "📲 NOVA App installieren (PWA)",
    suggestion_screen: "🔍 Bildschirmanalyse",
    suggestion_video: "🎬 Videobearbeitung",
    suggestion_bg: "🖼️ Hintergrundsuche",
    suggestion_code: "📝 Code-Schreiben",
    offline_banner: "⚡ Offline-Modus — Sie sind offline. Gespeicherter Verlauf ist verfügbar.",
    history_title: "🕒 Konversationsverlauf",
    settings_title: "⚙️ App-Einstellungen",
    voice_tool_title: "🎤 Sprache-zu-Text-Tool",
    mic_status_lbl: "🎙️ Mikrofon-Einstellungen:",
    mic_status_active: "Aktiv & Bereit",
    mic_status_inactive: "Deaktiviert",
    btn_check_mic: "📋 Berechtigung prüfen",
    btn_enable_mic: "🎤 Mikrofon aktivieren",
    alert_mic_disabled: "⚠️ Mikrofon ist in den Einstellungen deaktiviert! Bitte aktivieren Sie es.",
    alert_mic_denied: "⚠️ Mikrofonberechtigung verweigert! Bitte in den Browsereinstellungen erlauben."
  },
  'pt-PT': {
    brandName: "NOVA AI",
    placeholder: "Pergunte qualquer coisa ao NOVA...",
    intro_desc: "Pergunte em urdu, hindi ou inglês. Analise capturas de ecrã, reveja código e crie vídeos virais.",
    lbl_active_model: "🤖 Modelo de IA ativo:",
    lbl_api_key: "🔑 Chave API Google AI Studio:",
    lbl_mic_lang: "🎙️ Idioma do microfone:",
    lbl_speech_rate: "🗣️ Velocidade de fala:",
    btn_home_page: "Página Inicial",
    btn_new_chat: "Novo Chat",
    btn_history: "Histórico",
    btn_settings: "Definições",
    btn_photo_studio: "🎨 Estúdio & Editor de Fotos AI",
    btn_voice_tool: "🎤 Ferramenta de voz para texto",
    btn_video_gen: "🎬 Geração de vídeo",
    lbl_theme: "◐ Tema Escuro / Claro",
    lbl_voice_test: "🔊 Teste de som",
    btn_install_pwa: "📲 Instalar aplicação NOVA (PWA)",
    suggestion_screen: "🔍 Análise de ecrã",
    suggestion_video: "🎬 Edição de vídeo",
    suggestion_bg: "🖼️ Procura de fundo",
    suggestion_code: "📝 Escrita de código",
    offline_banner: "⚡ Modo offline — Está offline. Histórico guardado disponível.",
    history_title: "🕒 Histórico de conversas",
    settings_title: "⚙️ Definições da aplicação",
    voice_tool_title: "🎤 Ferramenta de voz para texto",
    mic_status_lbl: "🎙️ Definições de microfone:",
    mic_status_active: "Ativo & Pronto",
    mic_status_inactive: "Desativado",
    btn_check_mic: "📋 Verificar permissão",
    btn_enable_mic: "🎤 Ativar microfone",
    alert_mic_disabled: "⚠️ Microfone desativado nas Definições! Ative-o.",
    alert_mic_denied: "⚠️ Permissão de microfone negada! Permita o acesso nas definições do navegador."
  },
  'ru-RU': {
    brandName: "NOVA AI",
    placeholder: "Спросите NOVA о чем угодно...",
    intro_desc: "Задавайте вопросы на урду, хинди или английском. Анализируйте скриншоты, проверяйте код и создавайте вирусные видео.",
    lbl_active_model: "🤖 Активная модель ИИ:",
    lbl_api_key: "🔑 API-ключ Google AI Studio:",
    lbl_mic_lang: "🎙️ Язык микрофона:",
    lbl_speech_rate: "🗣️ Скорость воспроизведения речи:",
    btn_home_page: "Главная страница",
    btn_new_chat: "Новый чат",
    btn_history: "История чатов",
    btn_settings: "Настройки",
    btn_photo_studio: "🎨 Фотостудия и редактор ИИ",
    btn_voice_tool: "🎤 Голосовой ввод текста",
    btn_video_gen: "🎬 Генерация видео",
    lbl_theme: "◐ Темная / Светлая тема",
    lbl_voice_test: "🔊 Проверка звука",
    btn_install_pwa: "📲 Установить NOVA AI (PWA)",
    suggestion_screen: "🔍 Анализ экрана",
    suggestion_video: "🎬 Редактирование видео",
    suggestion_bg: "🖼️ Поиск фонов",
    suggestion_code: "📝 Написание кода",
    offline_banner: "⚡ Автономный режим — Вы не в сети. Доступна сохраненная история.",
    history_title: "🕒 История разговоров",
    settings_title: "⚙️ Настройки приложения",
    voice_tool_title: "🎤 Переводчик голоса в текст",
    mic_status_lbl: "🎙️ Настройки микрофона:",
    mic_status_active: "Активен и готов",
    mic_status_inactive: "Отключен",
    btn_check_mic: "📋 Проверить разрешение",
    btn_enable_mic: "🎤 Включить микрофон",
    alert_mic_disabled: "⚠️ Микрофон отключен в настройках! Пожалуйста, включите его.",
    alert_mic_denied: "⚠️ Доступ к микрофону заблокирован! Разрешите доступ в настройках браузера."
  },
  'tr-TR': {
    brandName: "NOVA Yapay Zeka (NOVA AI)",
    placeholder: "NOVA'ya bir şey sorun...",
    intro_desc: "Urduca, Hintçe veya İngilizce sorun. Ekran görüntülerini analiz edin, kodları inceleyin ve harika videolar üretin.",
    lbl_active_model: "🤖 Aktif Yapay Zeka Modeli:",
    lbl_api_key: "🔑 Google AI Studio API Anahtarı:",
    lbl_mic_lang: "🎙️ Mikrofon Dili:",
    lbl_speech_rate: "🗣️ Konuşma Sentezi Hızı:",
    btn_home_page: "Ana Sayfa",
    btn_new_chat: "Yeni Sohbet",
    btn_history: "Sohbet Geçmişi",
    btn_settings: "Ayarlar",
    btn_photo_studio: "🎨 Yapay Zeka Fotoğraf Stüdyosu",
    btn_voice_tool: "🎤 Sesi Metne Çevirme Aracı",
    btn_video_gen: "🎬 Video Üretimi",
    lbl_theme: "◐ Karanlık / Aydınlık Tema",
    lbl_voice_test: "🔊 Ses Testi",
    btn_install_pwa: "📲 NOVA Uygulamasını Yükle (PWA)",
    suggestion_screen: "🔍 Ekran Analizi",
    suggestion_video: "🎬 Video Düzenleme",
    suggestion_bg: "🖼️ Arka Plan Arama",
    suggestion_code: "📝 Kod Yazma",
    offline_banner: "⚡ Çevrimdışı Mod — İnternetiniz yok. Kayıtlı sohbet geçmişi kullanılabilir.",
    history_title: "🕒 Sohbet Geçmişi",
    settings_title: "⚙️ Uygulama Ayarları",
    voice_tool_title: "🎤 Sesi Metne Çevirme Aracı",
    mic_status_lbl: "🎙️ Mikrofon Ayarları:",
    mic_status_active: "Aktif ve Hazır",
    mic_status_inactive: "Devre Dışı",
    btn_check_mic: "📋 İzni Kontrol Et",
    btn_enable_mic: "🎤 Mikrofonu Etkinleştir",
    alert_mic_disabled: "⚠️ Mikrofon Ayarlarda devre dışı! Lütfen etkinleştirin.",
    alert_mic_denied: "⚠️ Mikrofon izni reddedildi! Lütfen tarayıcı ayarlarından izin verin."
  },
  'fa-IR': {
    brandName: "نوا (NOVA AI)",
    placeholder: "از نوا هر چیزی بپرسید...",
    intro_desc: "به زبان‌های اردو، هندی یا انگلیسی بپرسید. تصاویر را تحلیل کنید، کدها را بررسی کنید و ویدیو بسازید.",
    lbl_active_model: "🤖 مدل فعال هوش مصنوعی:",
    lbl_api_key: "🔑 کلید Google AI Studio:",
    lbl_mic_lang: "🎙️ زبان میکروفون:",
    lbl_speech_rate: "🗣️ سرعت صدای هوش مصنوعی:",
    btn_home_page: "صفحه اصلی",
    btn_new_chat: "گفتگوی جدید",
    btn_history: "تاریخچه گفتگو",
    btn_settings: "تنظیمات",
    btn_photo_studio: "🎨 استودیوی پیشرفته عکس نوا",
    btn_voice_tool: "🎤 تبدیل پیشرفته صدا به متن",
    btn_video_gen: "🎬 تولید ویدیو",
    lbl_theme: "◐ تم تاریک / روشن",
    lbl_voice_test: "🔊 تست صدا",
    btn_install_pwa: "📲 نصب برنامه نوا (PWA)",
    suggestion_screen: "🔍 تحلیل صفحه",
    suggestion_video: "🎬 ویرایش ویدیو",
    suggestion_bg: "🖼️ جستجوی پس‌زمینه",
    suggestion_code: "📝 نوشتن کد",
    offline_banner: "⚡ حالت آفلاین — شما آفلاین هستید. تاریخچه گفتگو در دسترس است.",
    history_title: "🕒 تاریخچه گفتگوها",
    settings_title: "⚙️ تنظیمات برنامه",
    voice_tool_title: "🎤 ابزار تبدیل صدا به متن",
    mic_status_lbl: "🎙️ تنظیمات میکروفون:",
    mic_status_active: "فعال و آماده",
    mic_status_inactive: "غیرفعال",
    btn_check_mic: "📋 بررسی دسترسی",
    btn_enable_mic: "🎤 فعال‌سازی میکروفون",
    alert_mic_disabled: "⚠️ میکروفون در تنظیمات غیرفعال است! لطفاً آن را روشن کنید.",
    alert_mic_denied: "⚠️ دسترسی به میکروفون رد شد! لطفاً در تنظیمات مرورگر اجازه دهید."
  },
  'pa-PK': {
    brandName: "نووا اے آئی (NOVA AI)",
    placeholder: "نووا توں کچھ وی پوچھو...",
    intro_desc: "پنجابی، اردو، ہندی یا انگریزی وچ پوچھو۔ اسکرین شاٹس اینالائز کرو، کوڈ ریویو کرو، تے وائرل ویڈیوز بناؤ۔",
    lbl_active_model: "🤖 ایکٹو اے آئی ماڈل:",
    lbl_api_key: "🔑 گوگل اے پی آئی کی:",
    lbl_mic_lang: "🎙️ مائیک دی زبان:",
    lbl_speech_rate: "🗣️ آواز دی رفتار:",
    btn_home_page: "ہوم پیج",
    btn_new_chat: "نواں چیٹ",
    btn_history: "چیٹ ہسٹری",
    btn_settings: "سیٹنگز",
    btn_photo_studio: "🎨 فوٹو اسٹوڈیو تے ایڈیٹر",
    btn_voice_tool: "🎤 وائس ٹو ٹیکسٹ ٹول",
    btn_video_gen: "🎬 ویڈیو جنریشن",
    lbl_theme: "◐ ڈارک / لائٹ تھیم",
    lbl_voice_test: "🔊 آواز دا ٹیسট",
    btn_install_pwa: "📲 نووا ایپ انسٹال کرو (PWA)",
    suggestion_screen: "🔍 اسکرین دا تجزیہ",
    suggestion_video: "🎬 ویڈیو ایڈیٹنگ",
    suggestion_bg: "🖼️ پس منظر دی تلاش",
    suggestion_code: "📝 کوڈ لکھنا",
    offline_banner: "⚡ آف لائن موڈ — تسی آف لائن او۔ محفوظ ہسٹری موجود ہے۔",
    history_title: "🕒 گفتگو دی ہسٹری",
    settings_title: "⚙️ ایپ سیٹنگز",
    voice_tool_title: "🎤 وائس ٹو ٹیکسٹ ٹول",
    mic_status_lbl: "🎙️ مائیکروفون سیٹنگز:",
    mic_status_active: "چالو تے تیار (Active)",
    mic_status_inactive: "بند (Disabled)",
    btn_check_mic: "📋 اجازت چیک کرو",
    btn_enable_mic: "🎤 مائیکروفون چالو کرو",
    alert_mic_disabled: "⚠️ مائیکروفون سیٹنگز وچوں بند ہے! براہ مہربانی سیٹنگز توں چالو کرو۔",
    alert_mic_denied: "⚠️ مائیک دی اجازت نئیں ملی! براہ مہربانی براؤزر توں اجازت دیو。"
  },
  'bn-IN': {
    brandName: "নোভা এআই (NOVA AI)",
    placeholder: "নোভা-কে যেকোনো কিছু জিজ্ঞাসা করুন...",
    intro_desc: "উর্দু, হিন্দি বা ইংরেজিতে জিজ্ঞাসা করুন। স্ক্রিনশট বিশ্লেষণ করুন, কোড পর্যালোচনা করুন এবং ভাইরাল ভিডিও তৈরি করুন।",
    lbl_active_model: "🤖 সক্রিয় এআই মডেল:",
    lbl_api_key: "🔑 গুগল এআই স্টুডিও এপিআই কি:",
    lbl_mic_lang: "🎙️ মাইক্রোফোনের ভাষা:",
    lbl_speech_rate: "🗣️ কথা বলার গতি:",
    btn_home_page: "হোম পেজ",
    btn_new_chat: "নতুন চ্যাট",
    btn_history: "চ্যাট ইতিহাস",
    btn_settings: "সেটিংস",
    btn_photo_studio: "🎨 এআই ফটো স্টুডিও এবং সম্পাদক",
    btn_voice_tool: "🎤 ভয়েস টু টেক্সট টুল",
    btn_video_gen: "🎬 ভিডিও জেনারেশন",
    lbl_theme: "◐ ডার্ক / লাইট থিম",
    lbl_voice_test: "🔊 ভয়েস টেস্ট",
    btn_install_pwa: "📲 নোভা অ্যাপ ইনস্টল করুন (PWA)",
    suggestion_screen: "🔍 স্ক্রিন বিশ্লেষণ",
    suggestion_video: "🎬 ভিডিও এডিটিং",
    suggestion_bg: "🖼️ ব্যাকগ্রাউন্ড অনুসন্ধান",
    suggestion_code: "📝 কোড লেখা",
    offline_banner: "⚡ অফলাইন মোড — আপনি অফলাইনে আছেন। সংরক্ষিত ইতিহাস উপলব্ধ।",
    history_title: "🕒 কথোপকথন ইতিহাস",
    settings_title: "⚙️ অ্যাপ সেটিংস",
    voice_tool_title: "🎤 ভয়েস টু টেক্সট টুল",
    mic_status_lbl: "🎙️ মাইক্রোফোন সেটিংস:",
    mic_status_active: "সক্রিয় এবং প্রস্তুত",
    mic_status_inactive: "নিষ্ক্রিয়",
    btn_check_mic: "📋 অনুমতি পরীক্ষা করুন",
    btn_enable_mic: "🎤 মাইক্রোফোন সক্ষম করুন",
    alert_mic_disabled: "⚠️ মাইক্রোফোন সেটিংসে নিষ্ক্রিয়! দয়া করে এটি অন করুন।",
    alert_mic_denied: "⚠️ মাইক্রোফোন অ্যাক্সেস অস্বীকৃত! দয়া করে ব্রাউজার সেটিংসে অনুমতি দিন।"
  }
};

// ============================================================================
// 2. CENTRALIZED APPLICATION UI TRANSLATOR
// ============================================================================
function applyAppTranslation(langCode) {
  // Map colloquial lang codes to valid translation dictionary entries
  let selectedLang = langCode || 'ur-PK';
  if (!APP_TRANSLATIONS[selectedLang]) {
    // Search for closest prefix match, e.g. 'ur' -> 'ur-PK'
    const short = selectedLang.split('-')[0];
    const found = Object.keys(APP_TRANSLATIONS).find(k => k.startsWith(short));
    selectedLang = found || 'en-US';
  }

  const dict = APP_TRANSLATIONS[selectedLang];
  if (!dict) return;

  console.log(`[NOVA Translator] Applying interface language translation for: ${selectedLang}`);

  // Save selected lang to localStorage
  localStorage.setItem('nova_speech_lang', selectedLang);

  // 1. Textarea and input placeholders
  const inputEl = document.getElementById('input');
  if (inputEl) {
    inputEl.placeholder = dict.placeholder;
  }

  // 2. Wordmark / Branding header elements
  const topTitle = document.getElementById('top-title');
  if (topTitle) topTitle.innerText = dict.brandName;

  const sidebarBrandText = document.querySelector('.sidebar .brand span');
  if (sidebarBrandText) sidebarBrandText.innerText = dict.brandName;

  const emptyTitle = document.querySelector('#empty-intro-wrap h1');
  if (emptyTitle) emptyTitle.innerText = dict.brandName;

  // 3. Keep empty home page clean
  const emptyDesc = document.querySelector('#empty-intro-wrap p');
  if (emptyDesc) emptyDesc.remove();

  // 4. Standalone Offline Banner
  const offlineBanner = document.getElementById('offline-banner');
  if (offlineBanner && dict.offline_banner) offlineBanner.innerText = dict.offline_banner;

  // Helper to translate sidebar buttons cleanly
  function translateSidebarButton(selector, text) {
    if (!text) return;
    const btn = document.querySelector(selector);
    if (btn) {
      const spans = btn.querySelectorAll('span');
      if (spans.length >= 2) {
        spans[1].innerText = text;
      } else if (spans.length === 1) {
        spans[0].innerText = text;
      } else {
        btn.innerText = text;
      }
    }
  }

  // 5. Sidebar Navigation buttons
  translateSidebarButton('.sidebar button[onclick*="goToHomePage"]', dict.btn_home_page);
  translateSidebarButton('.sidebar button[onclick*="newChat"]', dict.btn_new_chat);
  translateSidebarButton('.sidebar button[onclick*="openHistoryModal"]', dict.btn_history);
  translateSidebarButton('.sidebar button[onclick*="openSettingsModal"]', dict.btn_settings);
  translateSidebarButton('.sidebar button[onclick*="openPhotoStudioModal"]', dict.btn_photo_studio);
  translateSidebarButton('.sidebar button[onclick*="openVoiceToolModal"]', dict.btn_voice_tool);
  translateSidebarButton('.sidebar button[onclick*="video"]', dict.btn_video_gen);
  translateSidebarButton('.sidebar button[onclick*="toggleTheme"]', dict.lbl_theme);

  // 7. Modals titles
  const historyHeader = document.querySelector('#historyModal h3');
  if (historyHeader) {
    const span = historyHeader.querySelectorAll('span')[1] || historyHeader;
    if (span) span.innerText = dict.history_title;
  }

  const settingsHeader = document.querySelector('#settingsModal h3');
  if (settingsHeader) {
    const span = settingsHeader.querySelectorAll('span')[1] || settingsHeader;
    if (span) span.innerText = dict.settings_title;
  }

  const voiceToolHeader = document.querySelector('#voiceToolModal h3');
  if (voiceToolHeader) {
    const span = voiceToolHeader.querySelectorAll('span')[1] || voiceToolHeader;
    if (span) span.innerText = dict.voice_tool_title;
  }

  // 8. Settings settings form labels
  const settingsLabels = document.querySelectorAll('#settingsModal label');
  settingsLabels.forEach(lbl => {
    const text = lbl.textContent || '';
    if (text.includes('Active AI Model') || text.includes('فعال اے آئی ماڈل') || text.includes('सक्रिय एआई')) {
      lbl.innerHTML = dict.lbl_active_model;
    } else if (text.includes('Studio API Key') || text.includes('بیک اینڈ اے پی آئی کی') || text.includes('गूगल एआई')) {
      lbl.innerHTML = dict.lbl_api_key;
    } else if (text.includes('Microphone Language') || text.includes('مائیک کی زبان') || text.includes('माइक्रोफ़ोन')) {
      lbl.innerHTML = dict.lbl_mic_lang;
    } else if (text.includes('Synthesis Rate') || text.includes('آواز کی رفتار') || text.includes('भाषण')) {
      lbl.innerHTML = dict.lbl_speech_rate;
    }
  });

  // 9. Buttons inside Settings
  const settingsPWABtn = document.getElementById('settings-pwa-install-btn');
  if (settingsPWABtn) {
    const span = settingsPWABtn.querySelectorAll('span')[1] || settingsPWABtn;
    if (span) span.innerText = dict.btn_install_pwa;
  }

  const settingsThemeTextNode = document.querySelector('#settingsModal button[onclick*="toggleTheme"]');
  if (settingsThemeTextNode) {
    settingsThemeTextNode.innerText = dict.lbl_theme;
  }

  const settingsAudioTextNode = document.querySelector('#settingsModal button[onclick*="testSpeakerVoice"]');
  if (settingsAudioTextNode) {
    settingsThemeTextNode.innerText = dict.lbl_voice_test;
  }

  // 10. Voice custom panel translation
  const lblMicSettings = document.getElementById('lbl-mic-settings');
  if (lblMicSettings) lblMicSettings.innerText = dict.mic_status_lbl;

  const btnCheckMic = document.getElementById('btn-check-mic');
  if (btnCheckMic) btnCheckMic.innerText = dict.btn_check_mic;

  const btnEnableMic = document.getElementById('btn-enable-mic');
  if (btnEnableMic) btnEnableMic.innerText = dict.btn_enable_mic;

  // Sync mic status toggle UI
  const isMicEnabled = localStorage.getItem('nova_mic_enabled') !== 'false';
  const micStatusText = document.getElementById('micSettingsStatusText');
  if (micStatusText) {
    micStatusText.innerText = isMicEnabled ? dict.mic_status_active : dict.mic_status_inactive;
    micStatusText.style.color = isMicEnabled ? '#22c55e' : '#ef4444';
  }

  // 11. Apply Layout Direction dynamically based on the language (RTL for Urdu, Arabic, Farsi)
  const isRTL = ['ur-PK', 'ur-IN', 'ar-SA', 'fa-IR', 'pa-PK'].includes(selectedLang);
  document.body.dir = isRTL ? 'rtl' : 'ltr';
  document.body.style.textAlign = isRTL ? 'right' : 'left';

  // Apply direction to main input as well
  if (inputEl && !inputEl.value) {
    inputEl.style.direction = isRTL ? 'rtl' : 'ltr';
    inputEl.style.textAlign = isRTL ? 'right' : 'left';
  }

  // Re-sync all selector values to ensure UI unity
  ['micLanguageSelector', 'modalMicLanguageSelector', 'voiceToolLang'].forEach(selId => {
    const el = document.getElementById(selId);
    if (el && el.value !== selectedLang) {
      el.value = selectedLang;
    }
  });

  // Update HTML Document title
  document.title = `🎙️ ${dict.brandName} — Multilingual Assistant`;
}

// Synchronize all selectors and trigger translate
function handleLangSelectorChanged(newLang) {
  applyAppTranslation(newLang);
}

// Export selector methods globally to interop with HTML inline onchange handlers
if (typeof window !== 'undefined') {
  window.handleLangSelectorChanged = handleLangSelectorChanged;
  
  // Patch index.html existing sync callbacks
  window.syncMicLangFromModal = function(val) {
    localStorage.setItem('nova_speech_lang', val);
    const mainSel = document.getElementById('micLanguageSelector');
    if (mainSel) mainSel.value = val;
    handleLangSelectorChanged(val);
  };
  window.saveMicLanguage = function() {
    const mainSel = document.getElementById('micLanguageSelector');
    if (mainSel) {
      localStorage.setItem('nova_speech_lang', mainSel.value);
      const modalSel = document.getElementById('modalMicLanguageSelector');
      if (modalSel) modalSel.value = mainSel.value;
      handleLangSelectorChanged(mainSel.value);
    }
  };
}


// ============================================================================
// 3. MICROPHONE SETTINGS (ON/OFF, Status Checks, Injections)
// ============================================================================
function toggleMicrophoneSetting(enabled) {
  localStorage.setItem('nova_mic_enabled', enabled ? 'true' : 'false');
  
  const currentLang = localStorage.getItem('nova_speech_lang') || 'ur-PK';
  const dict = APP_TRANSLATIONS[currentLang] || APP_TRANSLATIONS['en-US'];

  const statusText = document.getElementById('micSettingsStatusText');
  const btnToggle = document.getElementById('btn-toggle-mic-onoff');

  if (statusText) {
    statusText.innerText = enabled ? dict.mic_status_active : dict.mic_status_inactive;
    statusText.style.color = enabled ? '#22c55e' : '#ef4444';
  }
  if (btnToggle) {
    btnToggle.innerText = enabled ? 'ON' : 'OFF';
    btnToggle.style.background = enabled ? 'var(--accent)' : '#ef4444';
  }

  showToast(enabled ? '🎙️ Microphone Enabled' : '🔇 Microphone Disabled');
}

// Support simple ON/OFF trigger from settings panel
function toggleMicrophoneSettingUI() {
  const isEnabled = localStorage.getItem('nova_mic_enabled') !== 'false';
  toggleMicrophoneSetting(!isEnabled);
}

// Explicit Microphone permission verification helper
async function checkMicrophonePermissionUI() {
  const currentLang = localStorage.getItem('nova_speech_lang') || 'ur-PK';
  const dict = APP_TRANSLATIONS[currentLang] || APP_TRANSLATIONS['en-US'];

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('⚠️ Supported microphone device not detected.');
    return;
  }

  try {
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    console.log(`[NOVA Mic] Permission status check: ${permissionStatus.state}`);
    
    if (permissionStatus.state === 'granted') {
      showToast('✓ Microphone access is GRANTED (فعال ہے)');
    } else if (permissionStatus.state === 'denied') {
      showToast(dict.alert_mic_denied);
    } else {
      showToast('ℹ️ Permission Prompt (مائیکروفون کی اجازت درکار ہے)');
    }
  } catch (e) {
    // MediaDevices check as fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      showToast('✓ Microphone connection validated!');
    } catch (err) {
      showToast(dict.alert_mic_denied);
    }
  }
}

// Force pop a permission request to the browser
async function requestMicrophonePermissionUI() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('⚠️ No audio recording devices found.');
    return;
  }

  try {
    showToast('⏳ Requesting microphone access...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    showToast('✓ Microphone enabled successfully! (مائیکروفون فعال ہو گیا)');
    toggleMicrophoneSetting(true);
  } catch (e) {
    const currentLang = localStorage.getItem('nova_speech_lang') || 'ur-PK';
    const dict = APP_TRANSLATIONS[currentLang] || APP_TRANSLATIONS['en-US'];
    showToast(dict.alert_mic_denied);
  }
}

// Inject custom Microphone controller in settings panel
function injectMicrophoneSettings() {
  const settingsModal = document.querySelector('#settingsModal .modal-card > div');
  if (!settingsModal) return;

  if (document.getElementById('microphoneToggle')) return;

  const micDiv = document.createElement('div');
  micDiv.style.background = 'var(--panel)';
  micDiv.style.border = '1px solid var(--line)';
  micDiv.style.borderRadius = '12px';
  micDiv.style.padding = '12px';
  micDiv.style.marginTop = '10px';

  micDiv.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <label id="lbl-mic-settings" style="font-size:12px; font-weight:700; color:var(--accent); display:block; margin-bottom:2px;">🎙️ Microphone Status:</label>
        <div id="micSettingsStatusText" style="font-size:11px; color:#22c55e; font-weight:600;">Active & Enabled</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="btn-toggle-mic-onoff" onclick="toggleMicrophoneSettingUI()" style="border:none; background:var(--accent); color:white; font-size:11.5px; font-weight:800; border-radius:6px; padding:6px 14px; cursor:pointer; outline:none; transition:background 0.2s;">ON</button>
        <input type="checkbox" id="microphoneToggle" checked style="display:none;">
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button id="btn-check-mic" onclick="checkMicrophonePermissionUI()" class="side-btn" style="flex:1; border:1px solid var(--line); padding:7px 10px; font-size:11px; font-weight:700; justify-content:center; cursor:pointer;">📋 Check Permission</button>
      <button id="btn-enable-mic" onclick="requestMicrophonePermissionUI()" class="side-btn" style="flex:1; background:var(--accent-soft); color:var(--accent); padding:7px 10px; font-size:11px; font-weight:700; justify-content:center; cursor:pointer;">🎤 Access Microphone</button>
    </div>
  `;

  // Inject before PWA element if found, or append
  const pwaBtn = document.getElementById('settings-pwa-install-btn');
  if (pwaBtn) {
    pwaBtn.parentNode.insertBefore(micDiv, pwaBtn);
  } else {
    settingsModal.appendChild(micDiv);
  }

  // Set initial slider toggle ON state
  const isEnabled = localStorage.getItem('nova_mic_enabled') !== 'false';
  const btnToggle = document.getElementById('btn-toggle-mic-onoff');
  const statusText = document.getElementById('micSettingsStatusText');
  if (btnToggle) {
    btnToggle.innerText = isEnabled ? 'ON' : 'OFF';
    btnToggle.style.background = isEnabled ? 'var(--accent)' : '#ef4444';
  }
  if (statusText) {
    const currentLang = localStorage.getItem('nova_speech_lang') || 'ur-PK';
    const dict = APP_TRANSLATIONS[currentLang] || APP_TRANSLATIONS['en-US'];
    statusText.innerText = isEnabled ? dict.mic_status_active : dict.mic_status_inactive;
    statusText.style.color = isEnabled ? '#22c55e' : '#ef4444';
  }
}

// Bind globally for click callbacks
if (typeof window !== 'undefined') {
  window.toggleMicrophoneSettingUI = toggleMicrophoneSettingUI;
  window.checkMicrophonePermissionUI = checkMicrophonePermissionUI;
  window.requestMicrophonePermissionUI = requestMicrophonePermissionUI;
}


// ============================================================================
// 4. BULLETPROOF WEB SPEECH API & MULTILINGUAL VOICE ENGINE
// ============================================================================
class WebVoiceAssistant {
  constructor(options = {}) {
    this.targetInputId = options.targetInputId || 'input';
    this.micButtonId = options.micButtonId || 'btn-mic-dictate';
    this.canvasId = options.canvasId || 'waveformCanvas';

    this.recognition = null;
    this.isListening = false;
    this.isStarting = false;
    this.hasDetectedSpeech = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.currentLang = 'en-US';

    this.baseTextBeforeListening = '';
    this.finalTranscriptAccumulated = '';
    this.interimTranscriptCurrent = '';

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.audioStream = null;
    this.waveformAnimationId = null;
    this.waveformPhase = 0;

    console.log('[NOVA Voice Engine] 🚀 Initializing WebVoiceAssistant module...');
    this.checkBrowserSupport();
  }

  checkBrowserSupport() {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechClass) {
      console.log('[NOVA Voice Engine] ✅ Native Web Speech API is FULLY SUPPORTED in this browser.');
      return true;
    } else {
      console.warn('[NOVA Voice Engine] ⚠️ Native Web Speech API not found. Fallback MediaRecorder + Gemini STT mode enabled.');
      return false;
    }
  }

  getEffectiveLanguage() {
    const selector = document.getElementById('micLanguageSelector') || document.getElementById('modalMicLanguageSelector');
    let lang = selector ? selector.value : null;
    if (!lang) {
      lang = localStorage.getItem('nova_speech_lang') || 'en-US';
    }
    // Normalize language tag
    if (lang === 'ur' || lang === 'ur-PK') lang = 'ur-PK';
    else if (lang === 'en' || lang === 'en-US') lang = 'en-US';
    else if (lang === 'hi' || lang === 'hi-IN') lang = 'hi-IN';
    else if (lang === 'ar' || lang === 'ar-SA') lang = 'ar-SA';
    return lang;
  }

  async start() {
    if (this.isListening || this.isStarting) {
      console.log('[NOVA Voice Engine] ⏹️ Stop requested by user.');
      this.stop();
      return;
    }

    // 1. Check if microphone is enabled in settings
    const isMicEnabled = localStorage.getItem('nova_mic_enabled') !== 'false';
    const dict = APP_TRANSLATIONS[this.getEffectiveLanguage()] || APP_TRANSLATIONS['en-US'];
    if (!isMicEnabled) {
      console.warn('[NOVA Voice Engine] ⚠️ Microphone is disabled in app settings.');
      showToast(dict.alert_mic_disabled || '⚠️ Microphone is disabled in settings. Turn it ON in Settings.');
      return;
    }

    this.isStarting = true;
    this.currentLang = this.getEffectiveLanguage();
    this.hasDetectedSpeech = false;
    this.retryCount = 0;
    this.finalTranscriptAccumulated = '';
    this.interimTranscriptCurrent = '';
    this.recordedChunks = [];

    // Capture existing text in input field
    const inputEl = document.getElementById(this.targetInputId);
    this.baseTextBeforeListening = inputEl ? (inputEl.value || '').trim() : '';

    console.log(`[NOVA Voice Engine] 🎙️ Starting Voice Engine in language: "${this.currentLang}"`);

    // 2. Try to capture microphone stream for high-fidelity server STT
    let streamSuccess = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('[NOVA Voice Engine] 🎙️ Opening microphone stream...');
        this.audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          }
        }).catch(async (e) => {
          console.warn('[NOVA Voice Engine] Constraint audio capture failed, retrying basic...');
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        });

        if (this.audioStream) {
          streamSuccess = true;
          console.log('[NOVA Voice Engine] ✓ Microphone audio stream active.');

          // Configure MediaRecorder for backend Gemini transcription
          let mimeType = 'audio/webm';
          if (typeof MediaRecorder !== 'undefined') {
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
            else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';

            try {
              this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });
              this.mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  this.recordedChunks.push(e.data);
                }
              };
              this.mediaRecorder.start(200);
              console.log(`[NOVA Voice Engine] 📡 MediaRecorder started (${mimeType}) in background.`);
            } catch (recErr) {
              console.error('[NOVA Voice Engine] Failed to initialize MediaRecorder:', recErr);
            }
          }
        }
      }
    } catch (micErr) {
      console.error('[NOVA Voice Engine] Microphone capture error:', micErr);
    }

    // 3. Start Web Speech API for real-time live-typing feedback
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechClass) {
      try {
        this.startWebSpeechRecognition(SpeechClass);
      } catch (recErr) {
        console.error('[NOVA Voice Engine] Web Speech API initialization error:', recErr);
      }
    } else {
      console.warn('[NOVA Voice Engine] Web Speech API not supported. Relying solely on Server-side Gemini STT.');
    }

    this.isListening = true;
    this.updateUIState(true);
    this.startWaveformAnimation();
    showToast(this.currentLang.startsWith('ur') ? '🎙️ آواز سن رہا ہے... بولیں!' : '🎙️ Listening... Speak now!');

    this.isStarting = false;
  }

  startWebSpeechRecognition(SpeechClass) {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    const rec = new SpeechClass();
    this.recognition = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = this.currentLang;

    rec.onstart = () => {
      console.log(`[NOVA Voice Engine] 🟢 Web Speech engine active (Language: ${rec.lang})`);
    };

    rec.onspeechstart = () => {
      console.log('[NOVA Voice Engine] 🗣️ User speech detected by browser engine.');
      this.hasDetectedSpeech = true;
    };

    rec.onresult = (event) => {
      let interimText = '';
      let newFinalText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        const transcript = res[0] ? res[0].transcript : '';

        if (res.isFinal) {
          newFinalText += transcript + ' ';
          console.log(`[NOVA Voice Engine] ✅ Browser word detected: "${transcript.trim()}"`);
        } else {
          interimText += transcript;
        }
      }

      if (newFinalText) {
        this.finalTranscriptAccumulated += newFinalText;
        this.hasDetectedSpeech = true;
      }
      this.interimTranscriptCurrent = interimText;

      const totalRecognized = (this.finalTranscriptAccumulated + this.interimTranscriptCurrent).trim();
      if (totalRecognized) {
        const fullInputText = this.baseTextBeforeListening
          ? `${this.baseTextBeforeListening} ${totalRecognized}`
          : totalRecognized;
        this.writeToInputField(fullInputText);
      }
    };

    rec.onerror = (event) => {
      let error = event && event.error ? String(event.error).toLowerCase().trim() : 'unknown';
      error = error.replace(/^["']|["']$/g, ''); // Remove quotes if present

      if (error === 'aborted' || error.includes('abort')) {
        console.log('[NOVA Voice Engine] Speech recognition aborted (intended or browser-managed stop).');
        return;
      }

      console.error(`[NOVA Voice Engine] ❌ Speech Recognition Error: "${error}"`);

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        console.warn('[NOVA Voice Engine] Microphone blocked or not allowed in Web Speech API.');
        showToast(this.currentLang.startsWith('ur') ? '⚠️ مائیکروفون کی اجازت مسترد ہے! براہ کرم براؤزر سیٹنگز سے چالو کریں۔' : '⚠️ Microphone permission denied! Please allow access in browser settings.');
        return;
      }

      // Retry on transient errors like network or silence to keep session active
      if (error === 'no-speech' || error === 'network') {
        if (this.isListening && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`[NOVA Voice Engine] Retrying Web Speech API (Attempt ${this.retryCount}/${this.maxRetries}) due to: "${error}"`);
          setTimeout(() => {
            if (this.isListening && this.recognition === rec) {
              try {
                rec.abort();
                rec.start();
              } catch (e) {
                console.warn('[NOVA Voice Engine] Retry start failed:', e.message);
              }
            }
          }, 400);
        }
      }
    };

    rec.onend = () => {
      console.log('[NOVA Voice Engine] Web Speech API session ended.');
      if (this.isListening && this.recognition === rec) {
        setTimeout(() => {
          if (this.isListening && this.recognition === rec) {
            try { rec.start(); } catch (e) {}
          }
        }, 150);
      }
    };

    try {
      rec.start();
    } catch (err) {
      console.error('[NOVA Voice Engine] Failed to start SpeechRecognition:', err.message);
    }
  }

  stop() {
    console.log('[NOVA Voice Engine] ⏹️ Stop requested. Finalizing transcription...');
    this.isListening = false;
    this.isStarting = false;
    this.updateUIState(false);
    this.stopWaveformAnimation();

    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.onerror = null;
        this.recognition.stop();
      } catch (e) {}
    }

    const currentLang = this.getEffectiveLanguage();
    const userStoredKey = localStorage.getItem('nova_user_gemini_key') || '';

    // Handle high-fidelity audio transcription using Gemini backend
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        const recorder = this.mediaRecorder;
        if (recorder.state === 'recording') {
          try { recorder.requestData(); } catch (e) {}
        }

        recorder.onstop = async () => {
          if (this.recordedChunks.length === 0) {
            console.warn('[NOVA Voice Engine] No audio segments recorded.');
            return;
          }

          const blob = new Blob(this.recordedChunks, { type: recorder.mimeType || 'audio/webm' });
          console.log(`[NOVA Voice Engine] 📤 Sending ${blob.size} bytes audio to server for Gemini STT transcription...`);

          // Only show transcribing toast if real-time engine hasn't written anything substantial yet
          const liveText = (this.finalTranscriptAccumulated + this.interimTranscriptCurrent).trim();
          if (!liveText) {
            showToast(currentLang.startsWith('ur') ? '⏳ گوگل اے آئی سے آواز تبدیل کی جا رہی ہے...' : '⏳ Transcribing with Google AI...');
          }

          const reader = new FileReader();
          reader.onload = async (ev) => {
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: ev.target.result,
                  mimeType: (recorder.mimeType || 'audio/webm').split(';')[0],
                  language: currentLang,
                  customApiKey: userStoredKey
                })
              });

              if (res.ok) {
                const data = await res.json();
                console.log('[NOVA Voice Engine] 📥 Server STT Response:', data);

                if (data && data.success && data.transcript && data.transcript.trim()) {
                  const verifiedText = data.transcript.trim();
                  console.log(`[NOVA Voice Engine] ✅ Google AI Studio Verified Transcript: "${verifiedText}"`);
                  
                  const combined = this.baseTextBeforeListening 
                    ? `${this.baseTextBeforeListening} ${verifiedText}` 
                    : verifiedText;
                  
                  this.writeToInputField(combined);
                  showToast(currentLang.startsWith('ur') ? '✓ آواز کامیابی سے لکھی گئی!' : '✓ Speech transcribed successfully!');
                } else {
                  console.warn('[NOVA Voice Engine] Server returned unsuccessful transcription. Falling back to local browser text.');
                  if (liveText) {
                    showToast(currentLang.startsWith('ur') ? '✓ آواز لکھی گئی (لوکل انجن)' : '✓ Transcribed (local engine)');
                  }
                }
              } else {
                console.warn('[NOVA Voice Engine] Server transcription endpoint error. Fallback active.');
              }
            } catch (err) {
              console.error('[NOVA Voice Engine] Failed to transcribe with server:', err);
            }
          };
          reader.readAsDataURL(blob);
        };

        recorder.stop();
      } catch (e) {
        console.error('[NOVA Voice Engine] Error stopping MediaRecorder:', e);
      }
    }

    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.audioStream = null;
    }

    const liveText = (this.finalTranscriptAccumulated + this.interimTranscriptCurrent).trim();
    if (liveText) {
      showToast(currentLang.startsWith('ur') ? '✓ آواز کامیابی سے لکھی گئی!' : '✓ Speech transcribed successfully!');
    }
  }

  toggle() {
    console.log(`[NOVA Voice Engine] 🔘 Microphone button toggled. State: isListening=${this.isListening}`);
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  writeToInputField(text) {
    const inputEl = document.getElementById(this.targetInputId);
    if (!inputEl) return;

    inputEl.value = text;

    // Set text direction automatically based on characters (RTL / LTR)
    const isRTL = /[\u0600-\u06FF]/.test(text);
    inputEl.style.direction = isRTL ? 'rtl' : 'ltr';
    inputEl.style.textAlign = isRTL ? 'right' : 'left';

    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    inputEl.focus();
    if (typeof adjustTextareaHeight === 'function') {
      adjustTextareaHeight(inputEl);
    }
    if (typeof updateEmptyStateVisibility === 'function') {
      updateEmptyStateVisibility();
    }
  }

  startWaveformAnimation() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      if (!this.isListening) return;

      ctx.clearRect(0, 0, w, h);
      this.waveformPhase += 0.22;

      const bars = 11;
      const spacing = w / bars;
      const barWidth = 3;

      for (let i = 0; i < bars; i++) {
        const sineWave = Math.abs(Math.sin(this.waveformPhase + i * 0.45));
        const barHeight = Math.max(4, sineWave * (h - 8) + 4);
        const x = i * spacing + (spacing - barWidth) / 2;
        const y = (h - barHeight) / 2;

        ctx.fillStyle = '#7c5cff';
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      this.waveformAnimationId = requestAnimationFrame(draw);
    };

    if (this.waveformAnimationId) cancelAnimationFrame(this.waveformAnimationId);
    this.waveformAnimationId = requestAnimationFrame(draw);
  }

  stopWaveformAnimation() {
    if (this.waveformAnimationId) {
      cancelAnimationFrame(this.waveformAnimationId);
      this.waveformAnimationId = null;
    }
    const canvas = document.getElementById(this.canvasId);
    if (canvas) {
      canvas.style.display = 'none';
    }
  }

  updateUIState(active) {
    const btn = document.getElementById(this.micButtonId);
    if (!btn) return;

    if (active) {
      btn.classList.add('mic-pulsing');
      btn.title = 'Stop listening...';
    } else {
      btn.classList.remove('mic-pulsing');
      btn.title = 'Microphone';
    }
  }
}

// ============================================================================
// 5. GLOBAL BOOTSTRAPPER ON DOMLOAD
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  console.log('[NOVA App] 🌟 Initializing NOVA AI voice system and translations...');

  // Initialize WebVoiceAssistant singleton
  const voiceAssistant = new WebVoiceAssistant();
  window.voiceAssistant = voiceAssistant;

  // Intercept the default inline microphone click handler in index.html dynamically
  const micBtn = document.getElementById('btn-mic-dictate');
  if (micBtn) {
    micBtn.removeAttribute('onclick');
    micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      voiceAssistant.toggle();
    });
    console.log('[NOVA App] ✓ Microphone button connected directly to WebVoiceAssistant.');
  }

  // Sync mic settings state on load
  const isEnabled = localStorage.getItem('nova_mic_enabled') !== 'false';
  toggleMicrophoneSetting(isEnabled);

  // Setup UI listener: Translate and inject settings when profile avatar is clicked
  const profileBtn = document.querySelector('button.avatar');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      setTimeout(() => {
        injectMicrophoneSettings();
        const savedLang = localStorage.getItem('nova_speech_lang') || 'en-US';
        applyAppTranslation(savedLang);
      }, 50);
    });
  }

  // Also hook sidebar settings open trigger
  const sideSettingsBtn = document.querySelector('.sidebar button[onclick*="openSettingsModal"]');
  if (sideSettingsBtn) {
    sideSettingsBtn.addEventListener('click', () => {
      setTimeout(() => {
        injectMicrophoneSettings();
        const savedLang = localStorage.getItem('nova_speech_lang') || 'en-US';
        applyAppTranslation(savedLang);
      }, 50);
    });
  }

  // Run translation initialization immediately on page load
  const savedLang = localStorage.getItem('nova_speech_lang') || 'en-US';
  applyAppTranslation(savedLang);
  console.log('[NOVA App] ✓ Voice system and translations initialized successfully.');
});

