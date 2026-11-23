import java.util.Properties

plugins {
    id("com.android.application")
}

// Release signing comes from environment variables (GitHub Actions secrets)
// or from android/keystore.properties on your own computer. Neither is in git.
val keyProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun signingValue(env: String, prop: String): String? = System.getenv(env) ?: keyProps.getProperty(prop)
val storeFilePath = signingValue("CM_KEYSTORE_FILE", "storeFile")

android {
    namespace = "io.github.mrwengkb.classmanager"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.github.mrwengkb.classmanager"
        minSdk = 23
        targetSdk = 36
        // Bump both for every upload to Play (versionCode must always go up).
        versionCode = 1
        versionName = "0.1.0"
    }

    signingConfigs {
        if (storeFilePath != null) {
            create("release") {
                storeFile = file(storeFilePath)
                storePassword = signingValue("CM_KEYSTORE_PASSWORD", "storePassword")
                keyAlias = signingValue("CM_KEY_ALIAS", "keyAlias")
                keyPassword = signingValue("CM_KEY_PASSWORD", "keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (storeFilePath != null) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
