# 课堂管家 · Class Manager — Android

安卓应用是一个 **Trusted Web Activity (TWA)**：打开后用手机上的 Chrome 全屏显示 `https://mrwengkb.github.io/ClassManager/`，没有地址栏。网站更新后应用马上跟着更新，不需要重新上传 Play。Google 登录和网页版一样（在 Chrome 里进行）。

The Android app is a **Trusted Web Activity**: it shows the live website full screen through Chrome on the phone. Website updates reach the app immediately; Google sign-in works exactly as on the web.

- 包名 / Package: `io.github.mrwengkb.classmanager`
- 版本 / Version: `app/build.gradle.kts` 里的 `versionCode`（每次上传 Play 都要 +1）和 `versionName`。

## 构建 / Build

GitHub Actions（`.github/workflows/android.yml`）在 `android/` 有改动时自动构建，也可以在 Actions 页面手动运行 **Android app**。构建完成后在该次运行的 **Artifacts** 下载：

- `class-manager-aab`：上传到 Google Play 的 `.aab`（需要先设置签名密钥）。
- `class-manager-apk`：直接装在手机上测试的 `.apk`。

没有设置签名密钥时只产出 debug APK。

### 签名密钥 / Signing key (GitHub secrets)

在仓库 Settings → Secrets and variables → Actions 新增：

| Secret | 内容 |
|---|---|
| `CM_KEYSTORE_BASE64` | `upload.jks` 的 base64 |
| `CM_KEYSTORE_PASSWORD` | 密钥库密码 |
| `CM_KEY_ALIAS` | `upload` |
| `CM_KEY_PASSWORD` | 密钥密码（与密钥库密码相同） |

这是 Play 的 **上传密钥**。Play 会另外用 Google 保管的 **应用签名密钥** 给用户安装的版本签名。上传密钥丢了可以在 Play Console 申请重置，但请把 `upload.jks` 和密码另外备份。

## 去掉地址栏：Digital Asset Links

TWA 要证明网站和应用是同一个主人，否则顶部会显示地址栏。证明文件必须放在网域根目录：

`https://mrwengkb.github.io/.well-known/assetlinks.json`

所以需要一个名为 **`MrWengKB/mrwengkb.github.io`** 的公开仓库（GitHub Pages 用户站点），放：

- `.well-known/assetlinks.json`：内容见本目录的 `assetlinks.json`
- `.nojekyll`（空文件，让 GitHub Pages 发布以点开头的文件夹）

`assetlinks.json` 里的 `sha256_cert_fingerprints` 要包含：

1. 上传密钥的指纹（已填入），给直接安装的测试 APK 用；
2. Play Console → 应用 → 测试和发布 → 应用完整性 → **应用签名密钥证书** 的 SHA-256 指纹，给从 Play 安装的版本用（第一次上传 AAB 后才会有）。

## 在电脑上构建 / Local build

用 Android Studio 打开 `android/` 文件夹即可。签名设定放在 `android/keystore.properties`（不进 git）：

```
storeFile=/path/to/upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```
