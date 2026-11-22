<h1>Class Manager</h1>

[华文](#华文) · [English](#english) · [Bahasa Melayu](#bahasa-melayu) · [தமிழ்](#தமிழ்)

---

## 华文

Class Manager 是给老师用的班级管理网页：摆放座位、导入名单、排座位、指派职务、给学生加分、记录阅读，上课时还能幸运抽选和倒计时。用 Google 账号登录，每位老师的班级资料保存在自己的 Google Drive 里，换电脑、换手机都能接着用。

### 页面

- `index.html`：**班级一览**（主页）。显示座位图、小组和职务，点学生座位加分，点小组名称给全组加分。
- `admin.html`：**管理**。布局、名单、排座位、职务、加分设置五个分页，需要先登录。
- `readlog.html`：**阅读打卡**。从主页右上角进入，也能链接回主页。
- `login.html`：用 Google 登录。

### 功能

- **Google 登录与云端保存**：每个班级是 Drive 里「Class Manager」文件夹中的一个文件。网站只申请 `drive.file` 权限，只能看到它自己建立的文件。每次修改约一秒后自动保存；如果同一个班级在别的分页或电脑上改过，会先载入较新的版本，不会互相覆盖。
- **多个班级**：顶部下拉菜单切换班级，可以新建班级，也可以打开 `.cm.json` 文件。
- **座位布局**：在空白地面上摆放单人桌或 4 人、6 人小组，可以拖动、框选、复制（Ctrl+D）、删除，也能一键生成整排座位。选中几张桌子就能组成小组，双击小组名称可以改名。
- **导入名单**：粘贴文字，或选择 `.txt`、`.csv`、`.xlsx` 文件，一行一位学生。性别可写在逗号或 Tab 后面（`M/F`、`男/女`、`L/P`、`ஆண்/பெண்` 等）。
- **排座位**：随机分配，或男女平衡分配。可以设定条件，比如「A 不能坐在 B 旁边」「A 和 B 不能同组」。也可以手动拖放安排。
- **职务**：内置组长和班长，也能自己添加、改名、删除职务。
- **加分**：在管理页设定加分项目、分值和图标，项目可以设为个人或小组。在主页点学生座位加个人分；点小组名称加小组分，全组每位组员都会得分。侧栏有分数排行榜、小组排名、各项目统计和最近记录，可以撤销。
- **幸运抽选**：讲台左边有「全班」「男生」「女生」三个按钮。同一组会先把每个人都抽过一遍才重复，抽中的学生座位会高亮。
- **倒计时**：讲台右边。有常用时长可选，也可以自己设定，能暂停、加 1 分钟。关掉弹窗也会继续计时，时间到会响铃提醒。
- **阅读打卡**：使用同一份名单。点书本打卡，满 10 本算 1 轮。有本周、本月阅读统计和阅读榜。阅读记录单独统计，不计入积分。
- **打印**：把整个教室排在一张横向的纸上。
- **离线使用**：管理页右上角可以下载整个网站的 zip，解压后打开 `index.html` 即可。
- **四种界面语言**：页面右上角可以切换华文、English、Melayu、தமிழ்。

### 部署

这是一个纯静态网页，放到 GitHub Pages 就能用。设定在 `js/config.js`：填入 Google OAuth Client ID；`useDrive` 设为 `false` 的话，资料只保存在浏览器里。Google Cloud 项目需要启用 Google Drive API，并把网站网址（例如 `https://mrwengkb.github.io`）加入已授权的 JavaScript 来源。

---

## English

Class Manager is a classroom management website for teachers. Lay out the desks, import the class list, assign seats and roles, award points and log reading, with a lucky draw and a timer for use during lessons. Teachers sign in with Google, and each teacher's classes are saved in their own Google Drive, so you can carry on from any computer or phone.

### Pages

- `index.html`: the **class view** (home page). It shows the seating plan, groups and roles. Click a student's desk to award points, or a group name to award the whole group.
- `admin.html`: **Manage**, with five tabs: Layout, Class list, Seating, Roles and Points. You need to sign in first.
- `readlog.html`: the **reading log**. Open it from the top right of the home page; it links back to the home page.
- `login.html`: Sign in with Google.

### Features

- **Google sign-in and cloud saving**: each class is one file in a `Class Manager` folder in the teacher's Drive. The site asks only for the `drive.file` permission, so it sees only the files it created. Changes are saved about a second after each edit. If the same class was changed in another tab or on another computer, the newer version is loaded first, so nothing is overwritten.
- **Multiple classes**: switch classes from the menu at the top, start a new class, or open a `.cm.json` file.
- **Desk layout**: place single desks or groups of 4 or 6 on an empty floor. Drag, box-select, duplicate (Ctrl+D) and delete them, or generate whole rows at once. Select desks to make a group, and double-click a group name to rename it.
- **Class list import**: paste text or choose a `.txt`, `.csv` or `.xlsx` file, one student per line. Gender can go after a comma or tab (`M/F`, `男/女`, `L/P`, `ஆண்/பெண்` and so on).
- **Seating**: assign seats randomly or balance boys and girls. Add conditions such as "A must not sit next to B" or "A and B must not be in the same group". You can also arrange seats by hand with drag and drop.
- **Roles**: group leader and class monitor are built in, and you can add, rename or delete your own roles.
- **Points**: set up point items with points and icons on the Manage page, each for individuals or for groups. On the home page, click a student's desk for individual points, or click a group name for group points, which every member of the group receives. The sidebar shows the leaderboard, group ranking, totals per item and recent awards, which can be undone.
- **Lucky draw**: three buttons left of the front of the class: Class, Boys and Girls. Everyone in that pool is picked once before anyone repeats, and the picked student's desk is highlighted.
- **Timer**: right of the front of the class. Choose a preset or set your own time, with pause and +1 minute. It keeps running when the window is closed and beeps when time is up.
- **Reading log**: uses the same class list. Tap a book to log it, and 10 books make 1 round. Includes weekly and monthly stats and a reading ranking. Reading is tracked separately and does not count towards points.
- **Printing**: fits the whole classroom onto one landscape page.
- **Offline use**: download the whole site as a zip from the top right of the Manage page, unzip it and open `index.html`.
- **Four interface languages**: switch at the top right between 华文, English, Melayu and தமிழ்.

### Setup

This is a static website and runs on GitHub Pages. Settings are in `js/config.js`: put in your Google OAuth Client ID, or set `useDrive` to `false` to keep data in the browser only. The Google Cloud project needs the Google Drive API enabled, with the site's address (for example `https://mrwengkb.github.io`) as an authorized JavaScript origin.

---

## Bahasa Melayu

Class Manager ialah laman web pengurusan kelas untuk guru. Susun meja, import senarai kelas, agihkan tempat duduk dan jawatan, beri mata dan rekod bacaan, dengan cabutan bertuah dan pemasa untuk digunakan semasa pelajaran. Guru log masuk dengan Google, dan kelas setiap guru disimpan dalam Google Drive mereka sendiri, jadi anda boleh menyambung kerja dari mana-mana komputer atau telefon.

### Halaman

- `index.html`: **paparan kelas** (halaman utama). Memaparkan pelan tempat duduk, kumpulan dan jawatan. Klik meja murid untuk memberi mata, atau nama kumpulan untuk memberi mata kepada seluruh kumpulan.
- `admin.html`: **Urus**, dengan lima tab: Susun atur, Senarai kelas, Tempat duduk, Jawatan dan Mata. Anda perlu log masuk dahulu.
- `readlog.html`: **rekod bacaan**. Buka dari bahagian atas kanan halaman utama; ada pautan kembali ke halaman utama.
- `login.html`: Log masuk dengan Google.

### Ciri-ciri

- **Log masuk Google dan simpanan awan**: setiap kelas ialah satu fail dalam folder `Class Manager` di Drive guru. Laman ini hanya meminta kebenaran `drive.file`, jadi ia hanya nampak fail yang dibuatnya sendiri. Perubahan disimpan kira-kira sesaat selepas setiap suntingan. Jika kelas yang sama diubah di tab atau komputer lain, versi yang lebih baru dimuatkan dahulu supaya tiada yang ditimpa.
- **Beberapa kelas**: tukar kelas melalui menu di bahagian atas, mulakan kelas baru, atau buka fail `.cm.json`.
- **Susun atur meja**: letak meja seorang atau kumpulan 4 atau 6 di atas lantai kosong. Seret, pilih dengan kotak, salin (Ctrl+D) dan padam, atau jana sebaris penuh sekali gus. Pilih beberapa meja untuk membentuk kumpulan, dan klik dua kali nama kumpulan untuk menukar nama.
- **Import senarai kelas**: tampal teks atau pilih fail `.txt`, `.csv` atau `.xlsx`, seorang murid setiap baris. Jantina boleh ditulis selepas koma atau tab (`M/F`, `男/女`, `L/P`, `ஆண்/பெண்` dan sebagainya).
- **Tempat duduk**: agihkan secara rawak atau seimbangkan lelaki dan perempuan. Tambah syarat seperti "A tidak boleh duduk sebelah B" atau "A dan B tidak boleh sekumpulan". Anda juga boleh menyusun sendiri dengan seret dan lepas.
- **Jawatan**: ketua kumpulan dan ketua darjah sudah tersedia, dan anda boleh menambah, menukar nama atau memadam jawatan sendiri.
- **Mata**: tetapkan item mata, nilai mata dan ikon di halaman Urus, sama ada untuk individu atau kumpulan. Di halaman utama, klik meja murid untuk mata individu, atau klik nama kumpulan untuk mata kumpulan yang diterima oleh setiap ahli. Bar sisi memaparkan papan pendahulu, kedudukan kumpulan, jumlah bagi setiap item dan rekod terkini, yang boleh dibuat asal.
- **Cabutan bertuah**: tiga butang di sebelah kiri hadapan kelas: Kelas, Lelaki dan Perempuan. Setiap orang dalam kumpulan itu dicabut sekali sebelum ada yang berulang, dan meja murid yang terpilih diserlahkan.
- **Pemasa**: di sebelah kanan hadapan kelas. Pilih tempoh sedia ada atau tetapkan sendiri, dengan jeda dan +1 minit. Pemasa terus berjalan walaupun tetingkap ditutup, dan berbunyi apabila masa tamat.
- **Rekod bacaan**: menggunakan senarai kelas yang sama. Tekan buku untuk merekod, dan 10 buku = 1 pusingan. Ada statistik mingguan dan bulanan serta kedudukan bacaan. Bacaan dikira berasingan dan tidak termasuk dalam mata.
- **Cetak**: memuatkan seluruh kelas pada satu halaman melintang.
- **Guna luar talian**: muat turun seluruh laman sebagai zip dari bahagian atas kanan halaman Urus, nyahzip dan buka `index.html`.
- **Empat bahasa paparan**: tukar di bahagian atas kanan antara 华文, English, Melayu dan தமிழ்.

### Pemasangan

Ini laman web statik dan boleh dijalankan di GitHub Pages. Tetapan ada dalam `js/config.js`: masukkan Google OAuth Client ID anda, atau tetapkan `useDrive` kepada `false` supaya data hanya disimpan dalam pelayar. Projek Google Cloud perlu mendayakan Google Drive API, dengan alamat laman (contohnya `https://mrwengkb.github.io`) sebagai asal JavaScript yang dibenarkan.

---

## தமிழ்

Class Manager என்பது ஆசிரியர்களுக்கான வகுப்பு நிர்வாக இணையதளம். மேசைகளை அமைக்கலாம், வகுப்புப் பட்டியலை இறக்குமதி செய்யலாம், இருக்கைகளையும் பொறுப்புகளையும் ஒதுக்கலாம், புள்ளிகள் வழங்கலாம், வாசிப்பைப் பதிவு செய்யலாம். பாடவேளையில் பயன்படுத்த அதிர்ஷ்டத் தேர்வும் நேரக் கணிப்பானும் உண்டு. ஆசிரியர்கள் Google மூலம் உள்நுழைவார்கள். ஒவ்வொரு ஆசிரியரின் வகுப்புகளும் அவரவர் Google Drive-இல் சேமிக்கப்படுவதால், எந்தக் கணினியிலிருந்தும் தொலைபேசியிலிருந்தும் தொடரலாம்.

### பக்கங்கள்

- `index.html`: **வகுப்புக் காட்சி** (முகப்புப் பக்கம்). இருக்கைத் திட்டம், குழுக்கள், பொறுப்புகளைக் காட்டும். புள்ளி வழங்க மாணவரின் மேசையை அழுத்துங்கள்; முழுக் குழுவுக்கும் வழங்கக் குழுப் பெயரை அழுத்துங்கள்.
- `admin.html`: **நிர்வாகம்**. அமைப்பு, வகுப்புப் பட்டியல், இருக்கை, பொறுப்புகள், புள்ளிகள் என ஐந்து தாவல்கள். முதலில் உள்நுழைய வேண்டும்.
- `readlog.html`: **வாசிப்புப் பதிவு**. முகப்புப் பக்கத்தின் மேல் வலப்பக்கத்திலிருந்து திறக்கலாம்; முகப்புப் பக்கத்துக்குத் திரும்பும் இணைப்பும் உண்டு.
- `login.html`: Google மூலம் உள்நுழைதல்.

### அம்சங்கள்

- **Google உள்நுழைவும் மேகக்கணிச் சேமிப்பும்**: ஒவ்வொரு வகுப்பும் ஆசிரியரின் Drive-இல் உள்ள `Class Manager` கோப்புறையில் ஒரு கோப்பாகச் சேமிக்கப்படும். இந்தத் தளம் `drive.file` அனுமதியை மட்டுமே கேட்கும், எனவே தான் உருவாக்கிய கோப்புகளை மட்டுமே பார்க்கும். ஒவ்வொரு திருத்தத்துக்கும் சுமார் ஒரு வினாடிக்குப் பிறகு தானாகச் சேமிக்கப்படும். அதே வகுப்பு வேறு தாவலில் அல்லது கணினியில் மாற்றப்பட்டிருந்தால், புதிய பதிப்பு முதலில் ஏற்றப்படும், எதுவும் மேலெழுதப்படாது.
- **பல வகுப்புகள்**: மேலே உள்ள பட்டியலில் வகுப்புகளை மாற்றலாம், புதிய வகுப்பைத் தொடங்கலாம், அல்லது `.cm.json` கோப்பைத் திறக்கலாம்.
- **மேசை அமைப்பு**: வெற்றுத் தரையில் தனி மேசைகளையோ 4 அல்லது 6 பேர் குழுக்களையோ வைக்கலாம். இழுக்கலாம், பெட்டியால் தேர்ந்தெடுக்கலாம், நகலெடுக்கலாம் (Ctrl+D), நீக்கலாம், அல்லது முழு வரிசைகளையும் ஒரே நேரத்தில் உருவாக்கலாம். மேசைகளைத் தேர்ந்தெடுத்துக் குழுவாக்கலாம்; குழுப் பெயரை இருமுறை அழுத்திப் பெயர் மாற்றலாம்.
- **வகுப்புப் பட்டியல் இறக்குமதி**: உரையை ஒட்டலாம், அல்லது `.txt`, `.csv`, `.xlsx` கோப்பைத் தேர்ந்தெடுக்கலாம், ஒரு வரிக்கு ஒரு மாணவர். பாலினத்தைக் காற்புள்ளி அல்லது Tab-க்குப் பின் எழுதலாம் (`M/F`, `男/女`, `L/P`, `ஆண்/பெண்` போன்றவை).
- **இருக்கை ஒதுக்கீடு**: சீரற்ற முறையில் ஒதுக்கலாம், அல்லது மாணவர், மாணவிகளைச் சமநிலைப்படுத்தலாம். "A, B-க்கு அருகில் அமரக்கூடாது", "A-யும் B-யும் ஒரே குழுவில் இருக்கக்கூடாது" போன்ற நிபந்தனைகளைச் சேர்க்கலாம். இழுத்து விடுவதன் மூலம் நீங்களே அமைக்கவும் முடியும்.
- **பொறுப்புகள்**: குழுத் தலைவர், வகுப்புத் தலைவர் ஆகியவை உள்ளமைக்கப்பட்டவை. உங்கள் சொந்தப் பொறுப்புகளைச் சேர்க்கலாம், பெயர் மாற்றலாம், நீக்கலாம்.
- **புள்ளிகள்**: நிர்வாகப் பக்கத்தில் புள்ளி உருப்படிகள், புள்ளி மதிப்பு, சின்னம் ஆகியவற்றை அமைக்கலாம்; ஒவ்வொன்றும் தனிநபருக்கா குழுவுக்கா என்று தேர்வு செய்யலாம். முகப்புப் பக்கத்தில் மாணவரின் மேசையை அழுத்தினால் தனிநபர் புள்ளி; குழுப் பெயரை அழுத்தினால் குழுப் புள்ளி, அது குழுவின் ஒவ்வொரு உறுப்பினருக்கும் சேரும். பக்கப்பட்டியில் தரவரிசை, குழுத் தரவரிசை, உருப்படிவாரி மொத்தம், சமீபத்திய பதிவுகள் காட்டப்படும்; பதிவுகளைச் செயல்தவிர்க்கலாம்.
- **அதிர்ஷ்டத் தேர்வு**: வகுப்பின் முன்பக்கத்தின் இடப்பக்கத்தில் வகுப்பு, மாணவர், மாணவிகள் என மூன்று பொத்தான்கள். அந்தப் பிரிவில் அனைவரும் ஒருமுறை தேர்வான பிறகுதான் மீண்டும் யாரும் வருவார்கள். தேர்வான மாணவரின் மேசை முன்னிலைப்படுத்தப்படும்.
- **நேரக் கணிப்பான்**: வகுப்பின் முன்பக்கத்தின் வலப்பக்கத்தில். முன்னமைக்கப்பட்ட நேரத்தைத் தேர்வு செய்யலாம் அல்லது நீங்களே அமைக்கலாம்; இடைநிறுத்தம், +1 நிமிடம் வசதிகளுடன். சாளரத்தை மூடினாலும் ஓடிக்கொண்டிருக்கும், நேரம் முடிந்ததும் ஒலிக்கும்.
- **வாசிப்புப் பதிவு**: அதே வகுப்புப் பட்டியலைப் பயன்படுத்தும். புத்தகத்தை அழுத்திப் பதிவு செய்யலாம். 10 புத்தகங்கள் = 1 சுற்று. வாராந்திர, மாதாந்திரப் புள்ளிவிவரங்களும் வாசிப்புத் தரவரிசையும் உண்டு. வாசிப்பு தனியாகக் கணக்கிடப்படும், புள்ளிகளில் சேராது.
- **அச்சிடுதல்**: முழு வகுப்பறையையும் ஒரு கிடைமட்டப் பக்கத்தில் அடக்கும்.
- **இணையம் இல்லாமல் பயன்படுத்துதல்**: நிர்வாகப் பக்கத்தின் மேல் வலப்பக்கத்திலிருந்து முழுத் தளத்தையும் zip ஆகப் பதிவிறக்கி, பிரித்தெடுத்து `index.html`-ஐத் திறக்கலாம்.
- **நான்கு இடைமுக மொழிகள்**: மேல் வலப்பக்கத்தில் 华文, English, Melayu, தமிழ் ஆகியவற்றுக்கு இடையே மாற்றலாம்.

### அமைப்பு

இது ஒரு நிலையான (static) இணையதளம், GitHub Pages-இல் இயங்கும். அமைப்புகள் `js/config.js`-இல் உள்ளன: உங்கள் Google OAuth Client ID-ஐச் சேருங்கள், அல்லது தரவை உலாவியில் மட்டும் வைத்திருக்க `useDrive`-ஐ `false` என அமையுங்கள். Google Cloud திட்டத்தில் Google Drive API இயக்கப்பட்டிருக்க வேண்டும்; தளத்தின் முகவரி (எ.கா. `https://mrwengkb.github.io`) அங்கீகரிக்கப்பட்ட JavaScript மூலமாகச் சேர்க்கப்பட்டிருக்க வேண்டும்.

---

SheetJS (`js/vendor/xlsx.full.min.js`, Apache-2.0) is bundled so that Excel import also works offline.
