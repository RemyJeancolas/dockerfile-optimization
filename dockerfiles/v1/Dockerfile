# Base image
FROM node:8

# Update system and install dependencies (the build-essential package is required to install the newrelic npm module)
RUN apt-get update && \
    apt-get install -y build-essential

# Create and define work directory
WORKDIR /code

# Copy required files
COPY ./ /code

# Install required npm packages
RUN npm set progress=false && \
    npm install --silent

# Build application
RUN npm run build

# Create dedicated user to not run the application as root (security best practice)
RUN useradd -d /code -u 5000 myuser && \
    chown -R myuser:myuser /code

USER myuser

# Expose application port
EXPOSE 8080

# Define entrypoint
ENTRYPOINT ["npm", "run"]

# Define default command
CMD ["start"]
