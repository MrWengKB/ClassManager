/* Class Manager · 四种语言（新加坡官方语言）: English, 中文, Bahasa Melayu, தமிழ் */
(function () {
  const LANGS = { en: 'English', zh: '中文', ms: 'Bahasa Melayu', ta: 'தமிழ்' };

  // key: [en, zh, ms, ta]
  const S = {
    appName: ['Class Manager', 'Class Manager', 'Class Manager', 'Class Manager'],
    appSub: ['Classroom seating planner', '座位编排小帮手', 'Perancang tempat duduk kelas', 'வகுப்பறை இருக்கை திட்டமிடல்'],
    classNamePh: ['Class name, e.g. 3E2', '班级名称，如：三年级忠班', 'Nama kelas, cth. 3 Bestari', 'வகுப்பின் பெயர், எ.கா. 3E2'],
    language: ['Language', '语言', 'Bahasa', 'மொழி'],
    newPlan: ['New', '新建', 'Baharu', 'புதியது'],
    confirmNew: ['Start a new plan? Unsaved changes will be lost.', '要新建吗？未保存的内容将会丢失。', 'Mula pelan baharu? Perubahan yang belum disimpan akan hilang.', 'புதிய திட்டத்தைத் தொடங்கவா? சேமிக்காத மாற்றங்கள் இழக்கப்படும்.'],
    open: ['Open', '打开', 'Buka', 'திற'],
    save: ['Save', '保存', 'Simpan', 'சேமி'],
    print: ['Print', '打印', 'Cetak', 'அச்சிடு'],
    offlineZip: ['Download for offline use', '下载离线版', 'Muat turun versi luar talian', 'ஆஃப்லைன் பதிப்பைப் பதிவிறக்கு'],
    offlineTitle: ['Use it offline', '离线使用', 'Guna tanpa internet', 'இணையம் இல்லாமல் பயன்படுத்துங்கள்'],
    offlineMsg: ['You can download the whole website and run it on your computer without internet.', '你可以下载整个网站的源文件，在电脑上不联网也能使用。', 'Anda boleh memuat turun seluruh laman web ini dan menggunakannya di komputer tanpa internet.', 'முழு இணையதளத்தையும் பதிவிறக்கி, இணையம் இல்லாமலேயே உங்கள் கணினியில் பயன்படுத்தலாம்.'],
    offlineStep1: ['Download the .zip file.', '下载 .zip 文件。', 'Muat turun fail .zip.', '.zip கோப்பைப் பதிவிறக்கவும்.'],
    offlineStep2: ['Unzip it to a folder.', '把它解压到一个文件夹。', 'Nyahzip ke dalam satu folder.', 'அதை ஒரு கோப்புறையில் பிரித்தெடுக்கவும்.'],
    offlineStep3: ['Double-click index.html to open it in your browser.', '双击 index.html，用浏览器打开。', 'Klik dua kali index.html untuk membukanya dalam pelayar.', 'index.html-ஐ இருமுறை கிளிக் செய்து உலாவியில் திறக்கவும்.'],
    offlineNote: ['Your seating plans are saved in that browser. Use Save / Open to move them between computers.', '座位安排会保存在那个浏览器里。要换电脑时，可以用“保存”和“打开”。', 'Pelan tempat duduk disimpan dalam pelayar itu. Gunakan Simpan / Buka untuk memindahkannya ke komputer lain.', 'இருக்கைத் திட்டங்கள் அந்த உலாவியில் சேமிக்கப்படும். வேறு கணினிக்கு மாற்ற சேமி / திற பயன்படுத்தவும்.'],
    offlineDownload: ['Download .zip', '下载 .zip', 'Muat turun .zip', '.zip பதிவிறக்கு'],
    close: ['Close', '关闭', 'Tutup', 'மூடு'],
    offlineTip: ['Download the website files (.zip). Unzip and open index.html to use it on your computer without internet.', '下载网站源文件（.zip）。解压后打开 index.html，就能在电脑上离线使用。', 'Muat turun fail laman web (.zip). Nyahzip dan buka index.html untuk menggunakannya di komputer tanpa internet.', 'இணையதளக் கோப்புகளைப் பதிவிறக்கவும் (.zip). பிரித்தெடுத்து index.html-ஐத் திறந்தால், இணையம் இல்லாமலேயே உங்கள் கணினியில் பயன்படுத்தலாம்.'],
    undo: ['Undo', '撤销', 'Buat asal', 'செயல்தவிர்'],
    redo: ['Redo', '重做', 'Buat semula', 'மீண்டும் செய்'],
    fileError: ['This is not a valid Class Manager file.', '这不是有效的 Class Manager 文件。', 'Ini bukan fail Class Manager yang sah.', 'இது சரியான Class Manager கோப்பு அல்ல.'],
    autosaved: ['Changes are saved automatically in this browser.', '改动会自动保存在本浏览器中。', 'Perubahan disimpan secara automatik dalam pelayar ini.', 'மாற்றங்கள் இந்த உலாவியில் தானாகச் சேமிக்கப்படும்.'],

    tabLayout: ['Layout', '布局', 'Susun atur', 'அமைப்பு'],
    tabRoster: ['Class list', '名单', 'Senarai kelas', 'பட்டியல்'],
    tabAssign: ['Seating', '排座位', 'Tempat duduk', 'இருக்கை'],
    tabRoles: ['Roles', '职务', 'Jawatan', 'பொறுப்புகள்'],
    tabPoints: ['Points', '加分', 'Mata', 'புள்ளிகள்'],

    // Points
    pt_participate: ['Answering questions', '积极发言', 'Aktif menjawab', 'கேள்விக்குப் பதில்'],
    pt_helping: ['Helping others', '帮助同学', 'Membantu rakan', 'பிறருக்கு உதவுதல்'],
    pt_homework: ['Great homework', '作业优秀', 'Kerja rumah cemerlang', 'சிறந்த வீட்டுப்பாடம்'],
    pt_teamwork: ['Teamwork', '小组合作', 'Kerja berpasukan', 'குழுப்பணி'],
    pointItemsTitle: ['Point items', '加分项目', 'Item mata', 'புள்ளி வகைகள்'],
    pointItemsHelp: ['Click an icon to change it. Use a negative number to take points away.', '点图标可以换一个。分数填负数就是扣分。', 'Klik ikon untuk menukarnya. Guna nombor negatif untuk menolak mata.', 'ஐகானை மாற்ற அதைக் கிளிக் செய்யவும். புள்ளிகளைக் கழிக்க எதிர்மறை எண்ணைப் பயன்படுத்தவும்.'],
    newItemPh: ['New item, e.g. Tidy desk', '新项目，如：桌面整洁', 'Item baharu, cth. Meja kemas', 'புதிய வகை, எ.கா. சுத்தமான மேசை'],
    pointsLabel: ['Points', '分数', 'Mata', 'புள்ளிகள்'],
    confirmDeleteItem: ['Delete “{name}”? Points already given for it will be removed too.', '要删除“{name}”吗？这个项目已经给出的分数也会一起删除。', 'Padam “{name}”? Mata yang sudah diberi untuknya juga akan dibuang.', '“{name}” ஐ நீக்கவா? இதற்கு ஏற்கனவே வழங்கிய புள்ளிகளும் நீக்கப்படும்.'],
    leaderboard: ['Leaderboard', '分数排行榜', 'Papan markah', 'தரவரிசை'],
    groupBoard: ['Group ranking', '小组排行', 'Kedudukan kumpulan', 'குழுத் தரவரிசை'],
    itemStatsTitle: ['By item', '各项目统计', 'Mengikut item', 'வகை வாரியாக'],
    itemStatLine: ['{n} times · {p} points', '{n} 次 · 共 {p} 分', '{n} kali · {p} mata', '{n} முறை · {p} புள்ளிகள்'],
    itemTop: ['Most: {names} ({n})', '最多：{names}（{n} 次）', 'Paling banyak: {names} ({n})', 'அதிகம்: {names} ({n})'],
    resetScores: ['Clear all points', '清空所有分数', 'Kosongkan semua mata', 'எல்லாப் புள்ளிகளையும் அழி'],
    confirmResetScores: ['Clear the points of every student? The point items are kept.', '要清空所有学生的分数吗？加分项目会保留。', 'Kosongkan mata semua murid? Item mata akan dikekalkan.', 'எல்லா மாணவர்களின் புள்ளிகளையும் அழிக்கவா? புள்ளி வகைகள் வைக்கப்படும்.'],
    noScoresYet: ['No points yet. In the class view, click a student’s desk to give points.', '还没有分数。在班级一览里点学生的座位就能加分。', 'Belum ada mata. Dalam paparan kelas, klik meja murid untuk memberi mata.', 'இன்னும் புள்ளிகள் இல்லை. வகுப்புப் பார்வையில் மாணவரின் மேசையைக் கிளிக் செய்து புள்ளி வழங்கவும்.'],
    noItems: ['No point items yet. Add them in Manage → Points.', '还没有加分项目，请到“管理 → 加分”里添加。', 'Belum ada item mata. Tambah dalam Urus → Mata.', 'புள்ளி வகைகள் இல்லை. நிர்வகி → புள்ளிகள் இல் சேர்க்கவும்.'],
    recentTitle: ['Recent', '最近加分', 'Terkini', 'சமீபத்தியவை'],
    pointsFor: ['Points for {name}', '给 {name} 加分', 'Mata untuk {name}', '{name} க்குப் புள்ளிகள்'],
    totalPoints: ['Total: {n}', '总分：{n}', 'Jumlah: {n}', 'மொத்தம்: {n}'],
    clickDeskHint: ['Click a student’s desk to give points.', '点学生的座位就能加分。', 'Klik meja murid untuk memberi mata.', 'புள்ளி வழங்க மாணவரின் மேசையைக் கிளிக் செய்யவும்.'],
    openView: ['Open the class view', '打开班级一览', 'Buka paparan kelas', 'வகுப்புப் பார்வையைத் திற'],

    front: ['Front of class', '讲台', 'Hadapan kelas', 'வகுப்பின் முன்பக்கம்'],
    zoomIn: ['Zoom in', '放大', 'Zum masuk', 'பெரிதாக்கு'],
    zoomOut: ['Zoom out', '缩小', 'Zum keluar', 'சிறிதாக்கு'],
    zoomFit: ['Fit', '适合大小', 'Muat', 'பொருத்து'],

    // Layout
    addTitle: ['Add desks', '添加座位', 'Tambah meja', 'மேசைகளைச் சேர்'],
    addDesk: ['1 desk', '单个座位', '1 meja', '1 மேசை'],
    addGroup4: ['Group of 4', '四人小组', 'Kumpulan 4', '4 பேர் குழு'],
    addGroup6: ['Group of 6', '六人小组', 'Kumpulan 6', '6 பேர் குழு'],
    quickTitle: ['Quick layout in rows', '快速生成行列', 'Susun atur baris pantas', 'விரைவு வரிசை அமைப்பு'],
    rows: ['Rows', '行', 'Baris', 'வரிசைகள்'],
    cols: ['Desks per row', '每行座位', 'Meja sebaris', 'வரிசைக்கு மேசைகள்'],
    arrSingle: ['Single desks', '单人桌', 'Meja tunggal', 'தனி மேசைகள்'],
    arrPairs: ['In pairs', '两人同桌', 'Berpasangan', 'இணையாக'],
    generate: ['Generate', '生成', 'Jana', 'உருவாக்கு'],
    confirmReplaceLayout: ['This replaces the current layout. Continue?', '这会替换当前的布局，确定吗？', 'Ini akan menggantikan susun atur semasa. Teruskan?', 'இது தற்போதைய அமைப்பை மாற்றிவிடும். தொடரவா?'],
    selTitle: ['Selected desks', '已选座位', 'Meja dipilih', 'தேர்ந்தெடுத்த மேசைகள்'],
    selectedN: ['{n} selected', '已选 {n} 个', '{n} dipilih', '{n} தேர்வு'],
    nothingSelected: ['Click a desk, or drag on the empty floor to select several.', '点选方块，或在空白处拖出方框来选多个。', 'Klik meja, atau seret di lantai kosong untuk memilih beberapa.', 'ஒரு மேசையைக் கிளிக் செய்யவும், அல்லது பலவற்றைத் தேர்ந்தெடுக்க வெற்றிடத்தில் இழுக்கவும்.'],
    duplicate: ['Duplicate', '复制', 'Salin', 'நகலெடு'],
    delete: ['Delete', '删除', 'Padam', 'நீக்கு'],
    makeGroup: ['Make a group', '设为一组', 'Jadikan kumpulan', 'குழுவாக்கு'],
    ungroup: ['Remove from group', '移出小组', 'Keluarkan dari kumpulan', 'குழுவிலிருந்து நீக்கு'],
    selectAll: ['Select all', '全选', 'Pilih semua', 'அனைத்தையும் தேர்ந்தெடு'],
    clearLayout: ['Clear layout', '清空布局', 'Kosongkan susun atur', 'அமைப்பை அழி'],
    confirmClearLayout: ['Remove all desks and groups?', '要删除所有座位和小组吗？', 'Padam semua meja dan kumpulan?', 'அனைத்து மேசைகளையும் குழுக்களையும் நீக்கவா?'],
    groupsTitle: ['Groups', '小组', 'Kumpulan', 'குழுக்கள்'],
    groupN: ['Group {n}', '第{n}组', 'Kumpulan {n}', 'குழு {n}'],
    noGroups: ['No groups yet. Select desks and click “Make a group”.', '还没有小组。选好座位后点“设为一组”。', 'Belum ada kumpulan. Pilih meja dan klik “Jadikan kumpulan”.', 'இன்னும் குழுக்கள் இல்லை. மேசைகளைத் தேர்ந்தெடுத்து “குழுவாக்கு” என்பதைக் கிளிக் செய்யவும்.'],
    deskCount: ['{n} desks · {g} groups', '共 {n} 个座位 · {g} 个小组', '{n} meja · {g} kumpulan', '{n} மேசைகள் · {g} குழுக்கள்'],
    renameGroupPh: ['Group name', '小组名称', 'Nama kumpulan', 'குழுவின் பெயர்'],
    rename: ['Rename', '改名', 'Tukar nama', 'பெயர் மாற்று'],
    layoutHelp: [
      'Drag desks to move them. Drag on the empty floor to box-select; Shift+click to add to the selection. Ctrl+D duplicates, Delete removes, arrow keys nudge.',
      '拖动方块来摆放座位。在空白处拖出方框可框选，Shift+点击可加选。Ctrl+D 复制，Delete 删除，方向键微调。',
      'Seret meja untuk mengalihkannya. Seret di lantai kosong untuk memilih; Shift+klik untuk menambah pilihan. Ctrl+D menyalin, Delete memadam, kekunci anak panah untuk anjak.',
      'மேசைகளை நகர்த்த இழுக்கவும். வெற்றிடத்தில் இழுத்துப் பலவற்றைத் தேர்ந்தெடுக்கலாம்; Shift+கிளிக் மூலம் சேர்க்கலாம். Ctrl+D நகலெடுக்கும், Delete நீக்கும், அம்புக் குறி விசைகள் சிறிது நகர்த்தும்.'
    ],

    // Roster
    importTitle: ['Import class list', '导入名单', 'Import senarai kelas', 'வகுப்புப் பட்டியலை இறக்குமதி செய்'],
    importHelp: [
      'One student per line, in any language. Gender is optional: add it after a comma or tab, e.g. “Tan Wei Ming, M”, “陈小明，女”, “Siti Aisyah, P”, “Kavya, பெண்”. For Excel: names in the first column, gender (optional) in the second.',
      '一行一人，名字可以是任何语言。性别可选：在逗号或Tab后注明，例如“Tan Wei Ming, M”、“陈小明，女”、“Siti Aisyah, P”、“Kavya, பெண்”。Excel：第一列姓名，第二列性别（可选）。',
      'Seorang murid sebaris, dalam apa-apa bahasa. Jantina adalah pilihan: tambah selepas koma atau tab, cth. “Tan Wei Ming, M”, “陈小明，女”, “Siti Aisyah, P”, “Kavya, பெண்”. Untuk Excel: nama dalam lajur pertama, jantina (pilihan) dalam lajur kedua.',
      'ஒரு வரிக்கு ஒரு மாணவர், எந்த மொழியிலும். பாலினம் விருப்பத்திற்குரியது: காற்புள்ளி அல்லது Tab-க்குப் பின் சேர்க்கவும், எ.கா. “Tan Wei Ming, M”, “陈小明，女”, “Siti Aisyah, P”, “Kavya, பெண்”. Excel: முதல் நெடுவரிசையில் பெயர், இரண்டாவதில் பாலினம் (விருப்பம்).'
    ],
    pastePh: ['Paste names here…', '在这里粘贴名单…', 'Tampal nama di sini…', 'பெயர்களை இங்கே ஒட்டவும்…'],
    chooseFile: ['Choose file (.txt .csv .xlsx)', '选择文件（.txt .csv .xlsx）', 'Pilih fail (.txt .csv .xlsx)', 'கோப்பைத் தேர்ந்தெடு (.txt .csv .xlsx)'],
    importAppend: ['Add to list', '追加到名单', 'Tambah ke senarai', 'பட்டியலில் சேர்'],
    importReplace: ['Replace list', '替换名单', 'Ganti senarai', 'பட்டியலை மாற்று'],
    confirmReplaceRoster: ['Replace the whole class list? Seats and roles will be cleared.', '要替换整个名单吗？座位和职务都会被清除。', 'Ganti seluruh senarai kelas? Tempat duduk dan jawatan akan dikosongkan.', 'முழுப் பட்டியலையும் மாற்றவா? இருக்கைகளும் பொறுப்புகளும் அழிக்கப்படும்.'],
    importedN: ['Imported {n} students.', '已导入 {n} 名学生。', '{n} murid diimport.', '{n} மாணவர்கள் இறக்குமதி செய்யப்பட்டனர்.'],
    importNone: ['No names found.', '没有找到名字。', 'Tiada nama ditemui.', 'பெயர்கள் எதுவும் கிடைக்கவில்லை.'],
    fileLoaded: ['Read {n} names from the file. Check them below, then click “Add to list” or “Replace list”.', '已从文件读取 {n} 个名字。请检查下面的内容，然后点“追加到名单”或“替换名单”。', '{n} nama dibaca daripada fail. Semak di bawah, kemudian klik “Tambah ke senarai” atau “Ganti senarai”.', 'கோப்பிலிருந்து {n} பெயர்கள் படிக்கப்பட்டன. கீழே சரிபார்த்து, “பட்டியலில் சேர்” அல்லது “பட்டியலை மாற்று” என்பதைக் கிளிக் செய்யவும்.'],
    importError: ['Could not read this file.', '无法读取这个文件。', 'Fail ini tidak dapat dibaca.', 'இந்தக் கோப்பைப் படிக்க முடியவில்லை.'],
    excelLoading: ['Loading Excel reader…', '正在载入 Excel 读取器…', 'Memuatkan pembaca Excel…', 'Excel வாசிப்பான் ஏற்றப்படுகிறது…'],
    addStudentPh: ['Add one student', '添加一名学生', 'Tambah seorang murid', 'ஒரு மாணவரைச் சேர்'],
    add: ['Add', '添加', 'Tambah', 'சேர்'],
    studentsN: ['Students ({n})', '学生（{n}）', 'Murid ({n})', 'மாணவர்கள் ({n})'],
    genderStats: ['Boys {m} · Girls {f} · Not set {u}', '男 {m} · 女 {f} · 未设 {u}', 'Lelaki {m} · Perempuan {f} · Belum ditetapkan {u}', 'ஆண் {m} · பெண் {f} · குறிப்பிடாதது {u}'],
    genderM: ['Boy', '男', 'Lelaki', 'ஆண்'],
    genderF: ['Girl', '女', 'Perempuan', 'பெண்'],
    genderU: ['Gender not set', '未设性别', 'Jantina belum ditetapkan', 'பாலினம் குறிப்பிடப்படவில்லை'],
    genderTip: ['Click to change gender', '点击切换性别', 'Klik untuk menukar jantina', 'பாலினத்தை மாற்றக் கிளிக் செய்யவும்'],
    renameStudentPh: ['Student name', '学生姓名', 'Nama murid', 'மாணவர் பெயர்'],
    clearRoster: ['Clear list', '清空名单', 'Kosongkan senarai', 'பட்டியலை அழி'],
    confirmClearRoster: ['Remove all students?', '要删除所有学生吗？', 'Padam semua murid?', 'அனைத்து மாணவர்களையும் நீக்கவா?'],
    confirmDeleteStudent: ['Remove {name}?', '要删除 {name} 吗？', 'Padam {name}?', '{name} நீக்கவா?'],
    emptyRoster: ['No students yet. Paste or import a list above.', '还没有学生，请在上方粘贴或导入名单。', 'Belum ada murid. Tampal atau import senarai di atas.', 'இன்னும் மாணவர்கள் இல்லை. மேலே பட்டியலை ஒட்டவும் அல்லது இறக்குமதி செய்யவும்.'],
    seatedMark: ['Seated', '已入座', 'Sudah duduk', 'அமர்ந்துள்ளார்'],

    // Assign
    autoTitle: ['Assign automatically', '自动分配', 'Agih secara automatik', 'தானாக ஒதுக்கு'],
    methodRandom: ['Random', '随机分配', 'Rawak', 'சீரற்ற முறை'],
    methodGender: ['Balance boys and girls', '男女平衡', 'Imbangkan lelaki dan perempuan', 'ஆண்–பெண் சமநிலை'],
    fillOnly: ['Keep current seats, only fill empty desks', '保留已排好的座位，只填空位', 'Kekalkan tempat sedia ada, isi meja kosong sahaja', 'தற்போதைய இருக்கைகளை வைத்து, காலி மேசைகளை மட்டும் நிரப்பு'],
    assignBtn: ['Assign seats', '开始分配', 'Agihkan tempat', 'இருக்கைகளை ஒதுக்கு'],
    clearSeats: ['Clear all seats', '清空所有座位', 'Kosongkan semua tempat', 'அனைத்து இருக்கைகளையும் காலியாக்கு'],
    confirmClearSeats: ['Take every student off their seat?', '要把所有学生移出座位吗？', 'Keluarkan semua murid dari tempat duduk?', 'அனைத்து மாணவர்களையும் இருக்கையிலிருந்து நீக்கவா?'],
    genderMissing: ['{n} student(s) have no gender set. They are placed anywhere. Set gender in the class list.', '有 {n} 名学生未设性别，会被随意安排。可在“名单”中设定。', '{n} murid tiada jantina. Mereka diletakkan di mana-mana. Tetapkan jantina dalam senarai kelas.', '{n} மாணவர்களுக்குப் பாலினம் குறிப்பிடப்படவில்லை. அவர்கள் எங்கும் அமர்த்தப்படுவர். பட்டியலில் பாலினத்தைக் குறிப்பிடவும்.'],
    resultOk: ['Done! All conditions are met.', '分配完成！所有条件都已满足。', 'Selesai! Semua syarat dipenuhi.', 'முடிந்தது! அனைத்து நிபந்தனைகளும் பூர்த்தியாயின.'],
    resultViolations: ['Done, but {n} condition(s) could not be met (marked ⚠ below).', '分配完成，但有 {n} 个条件无法满足（下方标 ⚠）。', 'Selesai, tetapi {n} syarat tidak dapat dipenuhi (ditanda ⚠ di bawah).', 'முடிந்தது, ஆனால் {n} நிபந்தனை(கள்) பூர்த்தியாகவில்லை (கீழே ⚠ குறி).'],
    notEnoughDesks: ['{n} student(s) have no desk. Add more desks in Layout.', '有 {n} 名学生没有座位，请在“布局”里添加座位。', '{n} murid tiada meja. Tambah meja dalam Susun atur.', '{n} மாணவர்களுக்கு மேசை இல்லை. அமைப்பில் மேலும் மேசைகளைச் சேர்க்கவும்.'],
    noDesks: ['Set up desks in Layout first.', '请先在“布局”中摆放座位。', 'Sediakan meja dalam Susun atur dahulu.', 'முதலில் அமைப்பில் மேசைகளை அமைக்கவும்.'],
    noStudents: ['Import a class list first.', '请先导入名单。', 'Import senarai kelas dahulu.', 'முதலில் வகுப்புப் பட்டியலை இறக்குமதி செய்யவும்.'],
    manualTitle: ['Arrange by hand', '自己安排', 'Susun sendiri', 'நீங்களே அமைக்கவும்'],
    manualHelp: [
      'Drag a name onto a desk, or click a name and then click a desk. Drag one desk onto another to swap. Drag a name back here to take it off its seat.',
      '把名字拖到座位方块上，或先点名字再点方块。把一个座位拖到另一个座位上可以对调。把名字拖回这里可取消座位。',
      'Seret nama ke meja, atau klik nama kemudian klik meja. Seret satu meja ke meja lain untuk bertukar. Seret nama kembali ke sini untuk mengosongkan tempatnya.',
      'பெயரை மேசைக்கு இழுக்கவும், அல்லது பெயரைக் கிளிக் செய்து பின் மேசையைக் கிளிக் செய்யவும். இரு மேசைகளை மாற்ற ஒன்றை மற்றொன்றின் மேல் இழுக்கவும். இருக்கையிலிருந்து நீக்க பெயரை இங்கே திரும்ப இழுக்கவும்.'
    ],
    unseatedN: ['Not seated yet ({n})', '未安排座位（{n}）', 'Belum duduk ({n})', 'இருக்கை இல்லாதவர்கள் ({n})'],
    allSeated: ['Everyone has a seat.', '所有学生都有座位了。', 'Semua murid sudah ada tempat.', 'அனைவருக்கும் இருக்கை உள்ளது.'],
    pickedHint: ['Now click a desk for {name}.', '现在点一个座位给 {name}。', 'Sekarang klik meja untuk {name}.', 'இப்போது {name} க்கு ஒரு மேசையைக் கிளிக் செய்யவும்.'],
    consTitle: ['Conditions', '条件', 'Syarat', 'நிபந்தனைகள்'],
    consAdjacent: ['must not sit next to', '不能坐在一起', 'tidak boleh duduk bersebelahan dengan', 'அருகில் அமரக்கூடாது'],
    consGroup: ['must not be in the same group as', '不能同组', 'tidak boleh sekumpulan dengan', 'ஒரே குழுவில் இருக்கக்கூடாது'],
    consAdd: ['Add condition', '添加条件', 'Tambah syarat', 'நிபந்தனை சேர்'],
    consNone: ['No conditions yet.', '还没有条件。', 'Belum ada syarat.', 'இன்னும் நிபந்தனைகள் இல்லை.'],
    consSame: ['Choose two different students.', '请选择两名不同的学生。', 'Pilih dua murid yang berbeza.', 'இரண்டு வெவ்வேறு மாணவர்களைத் தேர்ந்தெடுக்கவும்.'],
    consBroken: ['Not met in the current seating', '目前的座位不符合这个条件', 'Tidak dipenuhi dalam susunan semasa', 'தற்போதைய அமைப்பில் பூர்த்தியாகவில்லை'],
    pickStudent: ['— choose a student —', '— 选择学生 —', '— pilih murid —', '— மாணவரைத் தேர்ந்தெடு —'],
    consHelp: ['“Next to” includes front, back and diagonal neighbours.', '“坐在一起”包括前后左右及斜对角的相邻座位。', '“Bersebelahan” termasuk jiran di depan, belakang dan pepenjuru.', '“அருகில்” என்பது முன், பின், குறுக்கு அண்டை இருக்கைகளையும் உள்ளடக்கும்.'],

    // Roles
    rolesTitle: ['Roles', '职务', 'Jawatan', 'பொறுப்புகள்'],
    role_leader: ['Group leader', '组长', 'Ketua kumpulan', 'குழுத் தலைவர்'],
    role_monitor: ['Class monitor', '班长', 'Ketua darjah', 'வகுப்புத் தலைவர்'],
    newRolePh: ['New role, e.g. Chinese rep', '新职务，如：华文科代表', 'Jawatan baharu, cth. Bendahari', 'புதிய பொறுப்பு, எ.கா. பொருளாளர்'],
    renameRolePh: ['Role name', '职务名称', 'Nama jawatan', 'பொறுப்பின் பெயர்'],
    confirmDeleteRole: ['Delete the role “{name}”?', '要删除职务“{name}”吗？', 'Padam jawatan “{name}”?', '“{name}” பொறுப்பை நீக்கவா?'],
    pickForRole: ['Click a student’s name (here or on a desk) to give them a role.', '点选学生名字（这里或座位上）来指派职务。', 'Klik nama murid (di sini atau pada meja) untuk memberi jawatan.', 'பொறுப்பு வழங்க மாணவரின் பெயரைக் கிளிக் செய்யவும் (இங்கே அல்லது மேசையில்).'],
    rolesFor: ['Roles for {name}', '{name} 的职务', 'Jawatan untuk {name}', '{name} இன் பொறுப்புகள்'],
    summaryTitle: ['Role list', '职务一览', 'Senarai jawatan', 'பொறுப்புப் பட்டியல்'],
    nobody: ['(nobody yet)', '（暂无）', '(belum ada)', '(இன்னும் யாரும் இல்லை)'],
    allStudents: ['All students', '全部学生', 'Semua murid', 'அனைத்து மாணவர்கள்'],
    leaderNoGroup: ['not in a group', '不在小组里', 'bukan dalam kumpulan', 'குழுவில் இல்லை'],
    // Accounts (Sign in with Google)
    accSignInTitle: ['Sign in', '登录', 'Log masuk', 'உள்நுழை'],
    signInPrompt: ['Sign in with your Google account to manage your classes.', '请用 Google 账号登录来管理班级。', 'Log masuk dengan akaun Google anda untuk mengurus kelas.', 'வகுப்புகளை நிர்வகிக்க உங்கள் Google கணக்கில் உள்நுழையவும்.'],
    signInNoteDrive: ['Your classes are saved in your own Google Drive, in a folder called “Class Manager”. The site can only see the files it creates.', '班级资料会保存在你自己的 Google Drive 里的「Class Manager」文件夹。网站只能看到它自己建立的文件。', 'Kelas anda disimpan dalam Google Drive anda sendiri, dalam folder “Class Manager”. Laman ini hanya boleh melihat fail yang dibuatnya.', 'உங்கள் வகுப்புகள் உங்கள் சொந்த Google Drive-இல் “Class Manager” கோப்புறையில் சேமிக்கப்படும். இந்தத் தளம் தான் உருவாக்கிய கோப்புகளை மட்டுமே பார்க்க முடியும்.'],
    signInNoteLocal: ['For now, class data is saved only in this browser.', '班级资料目前只保存在这个浏览器里。', 'Buat masa ini, data kelas hanya disimpan dalam pelayar ini.', 'தற்போது வகுப்புத் தரவு இந்த உலாவியில் மட்டுமே சேமிக்கப்படும்.'],
    signInAgain: ['Your sign-in has expired. Please sign in again; your changes are kept.', '登录已过期，请重新登录。你的改动不会丢失。', 'Log masuk anda telah tamat. Sila log masuk semula; perubahan anda disimpan.', 'உங்கள் உள்நுழைவு காலாவதியானது. மீண்டும் உள்நுழையவும்; உங்கள் மாற்றங்கள் பாதுகாக்கப்படும்.'],
    signInGoogle: ['Sign in with Google', '使用 Google 账号登录', 'Log masuk dengan Google', 'Google மூலம் உள்நுழை'],
    continueGoogle: ['Continue with Google', '用 Google 继续', 'Teruskan dengan Google', 'Google மூலம் தொடரவும்'],
    err_popup: ['Sign-in was not completed. If no window appeared, allow pop-ups for this site and try again.', '登录没有完成。如果没有弹出窗口，请允许这个网站弹出窗口，再试一次。', 'Log masuk tidak selesai. Jika tiada tetingkap muncul, benarkan pop-up untuk laman ini dan cuba lagi.', 'உள்நுழைவு முடியவில்லை. சாளரம் தோன்றவில்லை என்றால், இந்தத் தளத்திற்கு பாப்-அப்களை அனுமதித்து மீண்டும் முயற்சிக்கவும்.'],
    err_scope: ['Please tick the box that lets Class Manager use Google Drive, so your classes can be saved.', '请勾选允许 Class Manager 使用 Google Drive 的选项，这样才能保存班级资料。', 'Sila tandakan kotak yang membenarkan Class Manager menggunakan Google Drive supaya kelas anda dapat disimpan.', 'உங்கள் வகுப்புகளைச் சேமிக்க, Class Manager Google Drive-ஐப் பயன்படுத்த அனுமதிக்கும் பெட்டியைத் தேர்வு செய்யவும்.'],
    err_gsi: ['Could not load Google sign-in. Check your internet connection.', '无法加载 Google 登录，请检查网络。', 'Log masuk Google tidak dapat dimuatkan. Semak sambungan internet anda.', 'Google உள்நுழைவை ஏற்ற முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'],
    syncLoading: ['Loading from Google Drive…', '正在从 Google Drive 读取…', 'Memuatkan dari Google Drive…', 'Google Drive-இலிருந்து ஏற்றுகிறது…'],
    syncSaving: ['Saving…', '保存中…', 'Menyimpan…', 'சேமிக்கிறது…'],
    syncSaved: ['Saved to Google Drive', '已保存到 Google Drive', 'Disimpan di Google Drive', 'Google Drive-இல் சேமிக்கப்பட்டது'],
    syncError: ['Not saved yet, will retry', '还没保存上，会自动重试', 'Belum disimpan, akan cuba lagi', 'இன்னும் சேமிக்கவில்லை, மீண்டும் முயலும்'],
    syncConflict: ['This class was changed somewhere else (another tab or computer). That version has been loaded.', '这个班在别的地方（另一个分页或电脑）被改过了，已载入那个版本。', 'Kelas ini telah diubah di tempat lain (tab atau komputer lain). Versi itu telah dimuatkan.', 'இந்த வகுப்பு வேறு இடத்தில் (மற்றொரு தாவல் அல்லது கணினி) மாற்றப்பட்டது. அந்தப் பதிப்பு ஏற்றப்பட்டது.'],
    classSelect: ['Class', '班级', 'Kelas', 'வகுப்பு'],
    newClass: ['New class', '新建班级', 'Kelas baharu', 'புதிய வகுப்பு'],
    untitled: ['(untitled class)', '（未命名班级）', '(kelas tanpa nama)', '(பெயரிடப்படாத வகுப்பு)'],
    aboutApp: ['Class Manager helps teachers plan their classroom: lay out the desks, import the class list, assign seats and give students roles. Your classes are saved in your own Google Drive.', 'Class Manager 帮助老师安排教室：摆放座位、导入名单、分配座位和指派职务。班级资料保存在你自己的 Google Drive 里。', 'Class Manager membantu guru merancang kelas: susun meja, import senarai kelas, agihkan tempat duduk dan beri jawatan kepada murid. Kelas anda disimpan dalam Google Drive anda sendiri.', 'Class Manager ஆசிரியர்கள் வகுப்பறையைத் திட்டமிட உதவுகிறது: மேசைகளை அமைத்தல், வகுப்புப் பட்டியலை இறக்குமதி செய்தல், இருக்கைகள் மற்றும் பொறுப்புகளை ஒதுக்குதல். உங்கள் வகுப்புகள் உங்கள் சொந்த Google Drive-இல் சேமிக்கப்படும்.'],
    viewSignIn: ['Sign in to see your classes.', '登录后就能看到班级。', 'Log masuk untuk melihat kelas anda.', 'உங்கள் வகுப்புகளைப் பார்க்க உள்நுழையவும்.'],
    signedInAs: ['Signed in as {name}', '已登录：{name}', 'Log masuk sebagai {name}', '{name} ஆக உள்நுழைந்துள்ளீர்கள்'],
    signOut: ['Sign out', '退出登录', 'Log keluar', 'வெளியேறு'],
    adminLink: ['Manage', '管理', 'Urus', 'நிர்வகி'],
    viewLink: ['View', '查看', 'Lihat', 'பார்'],

    // Class view (index.html)
    viewSub: ['Class view', '班级一览', 'Paparan kelas', 'வகுப்புப் பார்வை'],
    viewEmpty: ['No classroom has been set up yet.', '还没有布置教室。', 'Kelas belum disediakan.', 'வகுப்பறை இன்னும் அமைக்கப்படவில்லை.'],
    viewEmptyHint: ['Click “Manage” to set up the desks, class list, seating and roles.', '请点“管理”来设置布局、名单、座位和职务。', 'Klik “Urus” untuk menyediakan meja, senarai kelas, tempat duduk dan jawatan.', 'மேசைகள், பட்டியல், இருக்கைகள், பொறுப்புகளை அமைக்க “நிர்வகி” என்பதைக் கிளிக் செய்யவும்.'],
    viewStats: ['{s} student(s) · {d} desk(s) · {g} group(s)', '{s} 名学生 · {d} 个座位 · {g} 个小组', '{s} murid · {d} meja · {g} kumpulan', '{s} மாணவர்கள் · {d} மேசைகள் · {g} குழுக்கள்'],
    cancel: ['Cancel', '取消', 'Batal', 'ரத்து'],
    ok: ['OK', '确定', 'OK', 'சரி']
  };

  const ORDER = ['en', 'zh', 'ms', 'ta'];
  let lang = 'zh';
  try {
    const saved = (localStorage.getItem('classmanager:lang') || localStorage.getItem('paipaizuo:lang'));
    if (saved && LANGS[saved]) lang = saved;
    else {
      const nav = (navigator.language || '').toLowerCase();
      lang = nav.startsWith('zh') ? 'zh' : nav.startsWith('ms') ? 'ms' : nav.startsWith('ta') ? 'ta' : nav.startsWith('en') ? 'en' : 'zh';
    }
  } catch (e) { /* storage blocked */ }

  function t(key, vars) {
    const row = S[key];
    let s = row ? (row[ORDER.indexOf(lang)] || row[0]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }
  function setLang(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem('classmanager:lang', l); } catch (e) { /* ignore */ }
    document.documentElement.lang = { en: 'en', zh: 'zh-Hans', ms: 'ms', ta: 'ta' }[l];
  }
  setLang(lang);

  window.I18n = { t, setLang, LANGS, get lang() { return lang; } };
})();
