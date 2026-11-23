/* Class Manager · 设置
 * googleClientId: OAuth Client ID for “Sign in with Google”.
 * useDrive: true = each teacher's classes are saved in their own Google Drive
 *           (folder “Class Manager”). false = only in this browser.
 * googleApiKey: a Google API key (Drive API only, limited to this website) so that the student page
 *           (student.html) can read the class's public, encrypted student file without signing in.
 *           Empty = the student page is not available yet.
 */
window.CM_CONFIG = {
  googleClientId: '420207963838-f58s3508rduj67h3uf35h44m9mf1nb12.apps.googleusercontent.com',
  useDrive: true,
  googleApiKey: 'AIzaSyBNmMFf8fPNHo-IVeuh6Ed8yVKBdXzRXd8'
};
