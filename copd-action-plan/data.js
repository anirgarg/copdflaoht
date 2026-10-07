/* COPD Action Plan — medication lists, default zone content and translations.
 * Edit this file to change the medication pick-lists or default wording. */

// Medication categories. `group` decides where the medication appears on the plan:
//   "daily"  -> "My medications" table at the top
//   "rescue" -> the "My rescue medications" box inside the Yellow Zone
const MED_CATEGORIES = [
  { id: 'preventer', labelKey: 'preventerLabel', group: 'daily', placeholder: 'e.g. 1 puff once daily',
    options: [
      ['advair', 'Advair'], ['anoro', 'Anoro'], ['breo', 'Breo'], ['breztri', 'Breztri'],
      ['duaklir', 'Duaklir'], ['incruse', 'Incruse'], ['inspiolto', 'Inspiolto'], ['lupin', 'Lupin'],
      ['seebri', 'Seebri'], ['serevent', 'Serevent'], ['spiriva_handihaler', 'Spiriva (Handihaler)'],
      ['spiriva_respimat', 'Spiriva (Respimat)'], ['symbicort', 'Symbicort'], ['trelegy', 'Trelegy'],
      ['tudorza', 'Tudorza'], ['ultibro', 'Ultibro'], ['wixela', 'Wixela'],
    ] },
  { id: 'reliever', labelKey: 'relieverLabel', group: 'daily', placeholder: 'e.g. 1–2 puffs every 4 h as needed',
    options: [
      ['atrovent', 'Atrovent'], ['bricanyl', 'Bricanyl'], ['combivent', 'Combivent'],
      ['ventolin_diskus', 'Ventolin (Diskus)'], ['ventolin_mdi', 'Ventolin (MDI)'],
    ] },
  { id: 'regularAbx', labelKey: 'regularAbxLabel', group: 'daily', placeholder: 'e.g. 250 mg three times weekly',
    options: [
      ['azithromycin', 'Azithromycin (Zithromax)'], ['doxycycline', 'Doxycycline'], ['erythromycin', 'Erythromycin'],
    ] },
  { id: 'oxygen', labelKey: 'oxygenLabel', group: 'daily', placeholder: 'e.g. 2 L/min, 16 h per day',
    options: [['oxygen', 'Oxygen']] },
  { id: 'rescueSteroid', labelKey: 'rescueSteroidLabel', group: 'rescue', placeholder: 'e.g. 40 mg daily × 5 days',
    options: [
      ['prednisone', 'Prednisone'], ['prednisolone', 'Prednisolone'], ['medrol', 'Medrol (Methylprednisolone)'],
    ] },
  { id: 'rescueAbx', labelKey: 'rescueAbxLabel', group: 'rescue', placeholder: 'e.g. 500 mg TID × 7 days',
    options: [
      ['amoxicillin', 'Amoxicillin'], ['augmentin', 'Augmentin (Amoxicillin/Clavulanate)'],
      ['augmentin_df', 'Augmentin DF (Double Strength)'], ['azithromycin', 'Azithromycin (Zithromax)'],
      ['clarithromycin', 'Clarithromycin (Biaxin)'], ['moxifloxacin', 'Moxifloxacin (Avelox)'],
      ['levofloxacin', 'Levofloxacin (Levaquin)'], ['ciprofloxacin', 'Ciprofloxacin (Cipro)'],
      ['doxycycline', 'Doxycycline'],
    ] },
];

// Inhaler pictures (shown next to the medication on the plan).
const MED_IMAGES = {
  advair: 'medications/advair.jpg', anoro: 'medications/anoro.jpg', breo: 'medications/breo.jpg',
  breztri: 'medications/breztri.jpg', duaklir: 'medications/duaklir.jpg', incruse: 'medications/incruse.jpg',
  inspiolto: 'medications/inspiolto.jpg', lupin: 'medications/lupin.jpg', seebri: 'medications/seebri.jpg',
  serevent: 'medications/serevent.jpg', spiriva_handihaler: 'medications/spiriva_handihaler.jpg',
  spiriva_respimat: 'medications/spiriva_respimat.jpg', symbicort: 'medications/symbicort.jpg',
  trelegy: 'medications/trelegy.jpg', tudorza: 'medications/tudorza.jpg', ultibro: 'medications/ultibro.jpg',
  wixela: 'medications/wixela.jpg', atrovent: 'medications/atrovent.jpg', bricanyl: 'medications/bricanyl.jpg',
  combivent: 'medications/combivent.jpg', ventolin_diskus: 'medications/ventolin_diskus.jpg',
  ventolin_mdi: 'medications/ventolin_mdi.jpg',
};

// Default items in each zone. Items reference translation keys so they follow the
// selected language; once a clinician edits an item it becomes custom text.
const DEFAULT_ZONES = {
  green:  { symptoms: ['greenSymptom1', 'greenSymptom2'],
            actions:  ['greenAction1', 'greenAction2', 'greenAction3'] },
  yellow: { symptoms: ['yellowSymptom1', 'yellowSymptom2', 'yellowSymptom3'],
            actions:  ['yellowAction1', 'yellowAction2', 'yellowAction3'] },
  red:    { symptoms: ['redSymptom1', 'redSymptom2', 'redSymptom3'],
            actions:  ['redAction1', 'redAction2', 'redAction3'] },
};

const LANGUAGES = [
  ['en', 'English'], ['fr', 'Français'], ['es', 'Español'], ['zh', '中文 (Mandarin)'],
  ['yue', '粵語 (Cantonese)'], ['ar', 'العربية'], ['hi', 'हिन्दी'],
];
const RTL_LANGUAGES = ['ar'];

// Strings that appear on the printed plan. "{emergency}" is replaced with the
// emergency number set in the editor (911 by default).
const TRANSLATIONS = {
  en: {
    title: 'COPD Action Plan', clinicName: 'Kingston Community Health Centre',
    nameLabel: 'Name', dateLabel: 'Date', phoneLabel: 'Clinic phone', providerLabel: 'Health care provider',
    myMedsTitle: 'My medications', rescueMedsTitle: 'My rescue medications', notesLabel: 'Notes',
    preventerLabel: 'Preventer', relieverLabel: 'Reliever', regularAbxLabel: 'Regular antibiotic',
    oxygenLabel: 'Oxygen therapy', rescueSteroidLabel: 'Rescue steroid', rescueAbxLabel: 'Rescue antibiotic',
    symptomsLabel: 'If you have:', actionsLabel: 'Actions:',
    greenTitle: 'GREEN ZONE', greenSubtitle: 'Doing well',
    greenSymptom1: 'Breathing normal', greenSymptom2: 'Usual cough/sputum',
    greenAction1: 'Take preventer medication', greenAction2: 'Stay active', greenAction3: 'Avoid triggers',
    yellowTitle: 'YELLOW ZONE', yellowSubtitle: 'Symptoms worsening',
    yellowSymptom1: 'Increased breathlessness', yellowSymptom2: 'More cough/sputum', yellowSymptom3: 'Sputum color change',
    yellowAction1: 'Start rescue medications', yellowAction2: 'Use reliever more frequently', yellowAction3: 'Contact clinic if no improvement',
    redTitle: 'RED ZONE', redSubtitle: 'Severe symptoms',
    redSymptom1: 'Severe breathlessness', redSymptom2: "Can't speak in sentences", redSymptom3: 'Lips/nails blue',
    redAction1: 'CALL {emergency} IMMEDIATELY', redAction2: 'Use reliever medication', redAction3: 'Take rescue medications',
  },
  fr: {
    title: "Plan d'action BPCO", clinicName: 'Centre de santé communautaire de Kingston',
    nameLabel: 'Nom', dateLabel: 'Date', phoneLabel: 'Téléphone de la clinique', providerLabel: 'Professionnel de la santé',
    myMedsTitle: 'Mes médicaments', rescueMedsTitle: 'Mes médicaments de secours', notesLabel: 'Notes',
    preventerLabel: 'Médicament préventif', relieverLabel: 'Médicament de soulagement', regularAbxLabel: 'Antibiotique régulier',
    oxygenLabel: 'Oxygénothérapie', rescueSteroidLabel: 'Stéroïde de secours', rescueAbxLabel: 'Antibiotique de secours',
    symptomsLabel: 'Si vous avez :', actionsLabel: 'Actions :',
    greenTitle: 'ZONE VERTE', greenSubtitle: 'Bien',
    greenSymptom1: 'Respiration normale', greenSymptom2: 'Toux/expectorations habituelles',
    greenAction1: 'Prendre le médicament préventif', greenAction2: 'Rester actif', greenAction3: 'Éviter les déclencheurs',
    yellowTitle: 'ZONE JAUNE', yellowSubtitle: "Symptômes qui s'aggravent",
    yellowSymptom1: 'Essoufflement accru', yellowSymptom2: 'Plus de toux/expectorations', yellowSymptom3: 'Changement de couleur des expectorations',
    yellowAction1: 'Commencer les médicaments de secours', yellowAction2: 'Utiliser le soulagement plus fréquemment', yellowAction3: "Contacter la clinique si pas d'amélioration",
    redTitle: 'ZONE ROUGE', redSubtitle: 'Symptômes graves',
    redSymptom1: 'Essoufflement sévère', redSymptom2: 'Ne peut pas parler en phrases', redSymptom3: 'Lèvres/ongles bleus',
    redAction1: 'APPELER LE {emergency} IMMÉDIATEMENT', redAction2: 'Utiliser le médicament de soulagement', redAction3: 'Prendre les médicaments de secours',
  },
  es: {
    title: 'Plan de acción EPOC', clinicName: 'Centro de Salud Comunitario de Kingston',
    nameLabel: 'Nombre', dateLabel: 'Fecha', phoneLabel: 'Teléfono de la clínica', providerLabel: 'Profesional de salud',
    myMedsTitle: 'Mis medicamentos', rescueMedsTitle: 'Mis medicamentos de rescate', notesLabel: 'Notas',
    preventerLabel: 'Medicamento preventivo', relieverLabel: 'Medicamento de alivio', regularAbxLabel: 'Antibiótico regular',
    oxygenLabel: 'Oxigenoterapia', rescueSteroidLabel: 'Esteroide de rescate', rescueAbxLabel: 'Antibiótico de rescate',
    symptomsLabel: 'Si tiene:', actionsLabel: 'Acciones:',
    greenTitle: 'ZONA VERDE', greenSubtitle: 'Bien',
    greenSymptom1: 'Respiración normal', greenSymptom2: 'Tos/esputo habitual',
    greenAction1: 'Tomar medicamento preventivo', greenAction2: 'Mantenerse activo', greenAction3: 'Evitar desencadenantes',
    yellowTitle: 'ZONA AMARILLA', yellowSubtitle: 'Síntomas empeorando',
    yellowSymptom1: 'Aumento de la dificultad para respirar', yellowSymptom2: 'Más tos/esputo', yellowSymptom3: 'Cambio de color del esputo',
    yellowAction1: 'Iniciar medicamentos de rescate', yellowAction2: 'Usar el medicamento de alivio con más frecuencia', yellowAction3: 'Contactar a la clínica si no hay mejora',
    redTitle: 'ZONA ROJA', redSubtitle: 'Síntomas graves',
    redSymptom1: 'Dificultad respiratoria severa', redSymptom2: 'No puede hablar en oraciones', redSymptom3: 'Labios/uñas azules',
    redAction1: 'LLAMAR AL {emergency} INMEDIATAMENTE', redAction2: 'Usar medicamento de alivio', redAction3: 'Tomar medicamentos de rescate',
  },
  zh: {
    title: '慢性阻塞性肺疾病行动计划', clinicName: '金斯顿社区健康中心',
    nameLabel: '姓名', dateLabel: '日期', phoneLabel: '诊所电话', providerLabel: '医护人员',
    myMedsTitle: '我的药物', rescueMedsTitle: '我的紧急药物', notesLabel: '备注',
    preventerLabel: '预防药物', relieverLabel: '缓解药物', regularAbxLabel: '常规抗生素',
    oxygenLabel: '氧气疗法', rescueSteroidLabel: '紧急类固醇', rescueAbxLabel: '紧急抗生素',
    symptomsLabel: '如果您有：', actionsLabel: '行动：',
    greenTitle: '绿色区域', greenSubtitle: '情况良好',
    greenSymptom1: '呼吸正常', greenSymptom2: '日常咳嗽/痰',
    greenAction1: '服用预防药物', greenAction2: '保持活跃', greenAction3: '避免诱因',
    yellowTitle: '黄色区域', yellowSubtitle: '症状恶化',
    yellowSymptom1: '呼吸困难加重', yellowSymptom2: '咳嗽/痰增多', yellowSymptom3: '痰颜色改变',
    yellowAction1: '开始紧急药物', yellowAction2: '更频繁地使用缓解药物', yellowAction3: '如无改善请联系诊所',
    redTitle: '红色区域', redSubtitle: '严重症状',
    redSymptom1: '严重呼吸困难', redSymptom2: '无法说完整句子', redSymptom3: '嘴唇/指甲发蓝',
    redAction1: '立即拨打{emergency}', redAction2: '使用缓解药物', redAction3: '服用紧急药物',
  },
  yue: {
    title: '慢性阻塞性肺病行動計劃', clinicName: '京士頓社區健康中心',
    nameLabel: '姓名', dateLabel: '日期', phoneLabel: '診所電話', providerLabel: '醫護人員',
    myMedsTitle: '我的藥物', rescueMedsTitle: '我的緊急藥物', notesLabel: '備註',
    preventerLabel: '預防藥物', relieverLabel: '舒緩藥物', regularAbxLabel: '常規抗生素',
    oxygenLabel: '氧氣治療', rescueSteroidLabel: '緊急類固醇', rescueAbxLabel: '緊急抗生素',
    symptomsLabel: '如果你有：', actionsLabel: '行動：',
    greenTitle: '綠色區域', greenSubtitle: '情況良好',
    greenSymptom1: '呼吸正常', greenSymptom2: '日常咳嗽/痰',
    greenAction1: '服用預防藥物', greenAction2: '保持活躍', greenAction3: '避免誘因',
    yellowTitle: '黃色區域', yellowSubtitle: '症狀惡化',
    yellowSymptom1: '氣促加劇', yellowSymptom2: '咳嗽/痰增多', yellowSymptom3: '痰顏色改變',
    yellowAction1: '開始緊急藥物', yellowAction2: '更頻繁地使用舒緩藥物', yellowAction3: '如無改善請聯絡診所',
    redTitle: '紅色區域', redSubtitle: '嚴重症狀',
    redSymptom1: '嚴重氣促', redSymptom2: '無法說完整句子', redSymptom3: '嘴唇/指甲發藍',
    redAction1: '立即致電{emergency}', redAction2: '使用舒緩藥物', redAction3: '服用緊急藥物',
  },
  ar: {
    title: 'خطة عمل مرض الانسداد الرئوي المزمن', clinicName: 'مركز كينغستون الصحي المجتمعي',
    nameLabel: 'الاسم', dateLabel: 'التاريخ', phoneLabel: 'هاتف العيادة', providerLabel: 'مقدم الرعاية الصحية',
    myMedsTitle: 'أدويتي', rescueMedsTitle: 'أدوية الإنقاذ الخاصة بي', notesLabel: 'ملاحظات',
    preventerLabel: 'دواء الوقاية', relieverLabel: 'دواء الإغاثة', regularAbxLabel: 'المضاد الحيوي المنتظم',
    oxygenLabel: 'العلاج بالأكسجين', rescueSteroidLabel: 'الستيرويد الإنقاذي', rescueAbxLabel: 'المضاد الحيوي الإنقاذي',
    symptomsLabel: 'إذا كان لديك:', actionsLabel: 'الإجراءات:',
    greenTitle: 'المنطقة الخضراء', greenSubtitle: 'حالة جيدة',
    greenSymptom1: 'التنفس طبيعي', greenSymptom2: 'السعال/البلغم المعتاد',
    greenAction1: 'تناول دواء الوقاية', greenAction2: 'البقاء نشيطًا', greenAction3: 'تجنب المحفزات',
    yellowTitle: 'المنطقة الصفراء', yellowSubtitle: 'الأعراض تتفاقم',
    yellowSymptom1: 'زيادة ضيق التنفس', yellowSymptom2: 'زيادة السعال/البلغم', yellowSymptom3: 'تغير لون البلغم',
    yellowAction1: 'ابدأ أدوية الإنقاذ', yellowAction2: 'استخدم دواء الإغاثة بشكل متكرر', yellowAction3: 'اتصل بالعيادة إذا لم يحدث تحسن',
    redTitle: 'المنطقة الحمراء', redSubtitle: 'أعراض شديدة',
    redSymptom1: 'ضيق تنفس شديد', redSymptom2: 'لا يستطيع التحدث بجمل', redSymptom3: 'شفاه/أظافر زرقاء',
    redAction1: 'اتصل بالرقم {emergency} فورًا', redAction2: 'استخدم دواء الإغاثة', redAction3: 'تناول أدوية الإنقاذ',
  },
  hi: {
    title: 'सीओपीडी कार्य योजना', clinicName: 'किंग्स्टन सामुदायिक स्वास्थ्य केंद्र',
    nameLabel: 'नाम', dateLabel: 'दिनांक', phoneLabel: 'क्लिनिक फ़ोन', providerLabel: 'स्वास्थ्य सेवा प्रदाता',
    myMedsTitle: 'मेरी दवाएं', rescueMedsTitle: 'मेरी आपातकालीन दवाएं', notesLabel: 'टिप्पणियाँ',
    preventerLabel: 'निवारक दवा', relieverLabel: 'राहत दवा', regularAbxLabel: 'नियमित एंटीबायोटिक',
    oxygenLabel: 'ऑक्सीजन थेरेपी', rescueSteroidLabel: 'आपातकालीन स्टेरॉयड', rescueAbxLabel: 'आपातकालीन एंटीबायोटिक',
    symptomsLabel: 'यदि आपको है:', actionsLabel: 'कार्य:',
    greenTitle: 'ग्रीन ज़ोन', greenSubtitle: 'अच्छा कर रहे हैं',
    greenSymptom1: 'सांस सामान्य', greenSymptom2: 'सामान्य खांसी/बलगम',
    greenAction1: 'निवारक दवा लें', greenAction2: 'सक्रिय रहें', greenAction3: 'ट्रिगर्स से बचें',
    yellowTitle: 'पीला ज़ोन', yellowSubtitle: 'लक्षण बिगड़ रहे हैं',
    yellowSymptom1: 'सांस फूलना बढ़ा', yellowSymptom2: 'अधिक खांसी/बलगम', yellowSymptom3: 'बलगम का रंग बदलना',
    yellowAction1: 'आपातकालीन दवाएं शुरू करें', yellowAction2: 'राहत दवा का अधिक बार उपयोग करें', yellowAction3: 'सुधार न होने पर क्लिनिक से संपर्क करें',
    redTitle: 'लाल ज़ोन', redSubtitle: 'गंभीर लक्षण',
    redSymptom1: 'गंभीर सांस फूलना', redSymptom2: 'वाक्यों में बात नहीं कर सकते', redSymptom3: 'होंठ/नाखून नीले',
    redAction1: 'तुरंत {emergency} पर कॉल करें', redAction2: 'राहत दवा का उपयोग करें', redAction3: 'आपातकालीन दवाएं लें',
  },
};
