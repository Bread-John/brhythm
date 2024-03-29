# Brhythm
🎵 _Your best rhythm starts from here ..._

A music streaming platform back-end API, powered by Node.JS and Microsoft 365.

## TL;DR
A carefully crafted all-in-one music streaming solution for individuals or organisations to upload, manage, stream music in a cost-effective way, but still be able to enjoy functionalities that are comparable to commercial platforms.
### Demo
_More to come..._

## Features
- User authentication via Microsoft 365 OAuth
- Manage music based on artists, albums and tracks
- Create, add tracks to, and share your playlists
- Serve music content in byte chunks to improve user experience
- Automatically transcode and encrypt music content upon uploads
- Automatically fetch album cover arts and descriptions from external API
- Use OneDrive Business as the storage solution for static contents
- Secure transmission of copyrighted music content against leaks

_More to come..._

## Getting Started
### Recipe
1. A computing device that is capable of running Node.JS runtime environment
2. A domain name with corresponding SSL certificate configured
3. A relational database (preferably PostgreSQL) with appropriate access detail ready
4. A Redis database with appropriate access detail ready
5. An Azure Active Directory ADMIN (or global admin) account and configure it as follows:
   1. Create a new App Registration and configure the Redirect URI (choose "Web" for platform) as https://URL_TO_YOUR_BACKEND/auth/callback
   2. Go to "Certificates & secrets" section, add a new "Client secret" with desired expiry length
   3. Copy the value of the created secret and paste to a text file
   4. Go to "API permissions" section, add following permissions:
      - Microsoft Graph --> Delegated permissions --> OpenId permissions --> email & profile
      - Microsoft Graph --> Application permissions --> Files --> Files.ReadWrite.All
      - Microsoft Graph --> Application permissions --> User --> User.Read.All
   5. Click "Grant admin consent for ..." and confirm
6. A compatible front-end web user interface _(official front-end SPA will be released soon)_
7. (Optional, for fetching album cover arts) A valid Last.FM API key, acquired from Last.FM developer portal

### Install
1. Clone this repository
2. Run following commands to install dependencies:
   ```
   $ cd brhythm
   $ npm ci
   ```
3. Use your preferred text editor to fill in all the required configurations in `.env.sample` file
4. Rename `.env.sample` file to `.env`
5. Make sure you have properly configured firewalls and/or security groups so that inbound traffic is not dropped
6. Start the Node.JS instance by invoking:
   ```
   # Option 1: Not recommended
   $ npm start

   # Option 2: Preferred (if pm2 module is installed)
   $ pm2 start --name brhythm-api ./bin/www
   ## Run the instance automatically after server reboots
   $ pm2 startup
   $ pm2 save
   ```
7. Ready to go ~

## Documentation
_More to come..._

## Additional Resources
- [Register an application with the Microsoft identity platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [PM2 - Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Getting Started | Sequelize](https://sequelize.org/docs/v6/getting-started/)
- [FFmpeg Formats Documentation - 4.17 hls](https://ffmpeg.org/ffmpeg-formats.html#hls-2)
- [HTTP Live Streaming (HLS) Authoring Specification](https://developer.apple.com/documentation/http_live_streaming/http_live_streaming_hls_authoring_specification_for_apple_devices)
- [Microsoft Graph REST API v1.0 endpoint reference](https://docs.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0)
- [OpenID Connect on the Microsoft identity platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc)

## Changelogs
### v1.0.0
- AES-128 media encryption provisioned
- User profile details retrieval route added
- Data models modified for better compatibility

### v0.x.y
_Omitted, refer to [Commits History](https://github.com/Bread-John/brhythm/commits/main) for more info_

## Contributing
If you believe you have found any bug or security vulnerability, feel free to open an issue. Pull requests are also welcomed.

## Author
[Connaught](https://johnnybread.com) (Bread-John)

## License
Copyright &copy; 2022 Bread-John. All Rights Reserved.
Licensed under Creative Commons Attribution Share Alike 4.0 International (CC-BY-SA-4.0) (see ["License"](/LICENSE) for more detail)
