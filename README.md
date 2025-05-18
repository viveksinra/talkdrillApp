# TalkDrill: Language Learning App

## Application Overview

TalkDrill is a comprehensive language learning mobile application designed to help users improve their language proficiency through interactive conversations with AI and peer users. The app provides a platform for language practice through various modes including AI chat, AI calls, peer chat, and peer calls, followed by detailed performance analysis and feedback.

### Key Features

- **Multiple Practice Modes**:
  - AI Chat: Text-based conversations with AI language partners
  - AI Call: Voice conversations with AI models
  - Peer Chat: Text conversations with other language learners
  - Peer Call: Voice calls with other users for real-time practice

- **Smart Matching System**: Find language partners based on proficiency level, interests, and preferences

- **Performance Analysis**: Detailed reports after each session with metrics on:
  - Fluency
  - Grammar
  - Vocabulary
  - Pronunciation

- **Virtual Currency System**: Earn and spend coins for premium features

- **Progress Tracking**: Track improvement over time with session history and analytics

## High-Level Design

### Architecture

TalkDrill is built using a modern React Native architecture with Expo, implementing:

- **File-based Routing**: Using Expo Router for navigation
- **Context API**: For global state management
- **Real-time Communication**: Socket.IO for instant messaging and WebRTC for voice calls
- **TypeScript**: For type safety and enhanced developer experience

### System Components

1. **Authentication System**
   - Phone-based authentication with OTP verification
   - Account setup and profile management

2. **Session Management**
   - AI session initialization and management
   - Peer matching algorithm
   - Real-time communication protocols

3. **Analytics Engine**
   - Speech-to-text processing (using Deepgram)
   - Language analysis and metrics generation
   - Report creation and storage

4. **Coin Economy**
   - Virtual currency management
   - Transaction history
   - Premium feature access control

### Data Models

The application revolves around these core data models:

- **User**: Profile, statistics, preferences
- **Session**: Conversation details, participants, duration
- **Report**: Performance metrics, transcript analysis, improvement suggestions
- **Transaction**: Coin economy activities
- **Notification**: System messages and alerts

### API Integration

TalkDrill integrates several external services:

- **Socket.IO**: For real-time messaging and online status
- **WebRTC**: For peer-to-peer voice calls
- **Deepgram**: For speech recognition and analysis
- **Custom Backend APIs**: For user management, session history, and reporting

### UI/UX Design

The app follows a clean, intuitive design with:

- **Tab-based Navigation**: For main sections (Calls, Chat, Reports, Settings)
- **Custom Components**: Including parallax scrolling, haptic feedback tabs
- **Responsive Layout**: Adapting to different device sizes
- **Dark/Light Mode**: Supporting system theme preferences

## Technical Stack

- **Frontend**: React Native, Expo
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: Expo Router
- **Styling**: React Native's built-in styling system
- **APIs**: RESTful services, WebSockets
- **Voice Processing**: WebRTC, Deepgram integration

## Deployment

The app is configured for deployment to:
- iOS App Store
- Google Play Store

Using Expo's EAS Build system for optimized native builds.

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## how to run the app locally

1. download(https://drive.google.com/file/d/18lHSb0xMDhfNv5F5VuWG2f6lyIh1BsLm/view?usp=sharing) install this development apk in real android device, if you have two devices install in both

2. open the talkdrillApp folder in vs code terminal

3. run the command `npm install`

4. run the command `npx expo start --tunnel`

5. you can see something like using development build in expo console, if you see using Expo Go, press s in terminal

6. scan the QR with camera and paste the link in installed app in the section called 'Enter URL manually'

7. app will be functioning, you can test the app


