FROM node:18-alpine

# Install Java (required for Firebase emulators)
RUN apk add --no-cache openjdk11-jre-headless

# Install Firebase CLI
RUN npm install -g firebase-tools@latest

# Create app directory
WORKDIR /opt/firebase

# Copy Firebase configuration
COPY firebase.json .firebaserc ./

# Create data directory
RUN mkdir -p /opt/firebase/data

# Expose all emulator ports
EXPOSE 9099 8080 9000 9199 5001 8085 4000 4400 4500

# Default command
CMD ["firebase", "emulators:start", "--project", "love-claude-dev"]