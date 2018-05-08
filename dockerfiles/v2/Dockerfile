# Base image
FROM alpine:3.7

# Update system and install dependencies
RUN apk update && \
    apk add nodejs make gcc g++ python

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
RUN adduser -D -h /code -u 5000 myuser && \
    chown -R myuser:myuser /code

USER myuser

# Expose application port
EXPOSE 8080

# Define entrypoint
ENTRYPOINT ["npm", "run"]

# Define default command
CMD ["start"]
