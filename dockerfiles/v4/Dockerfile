######################
##### Base stage #####
######################

# Base image with alias
FROM alpine:3.7 as base

# Create and define work directory
WORKDIR /code

# Copy only the minimal required files
COPY package.json package-lock.json /code/

# Update system, install dependencies, install npm production dependencies and clean everything when done
RUN apk --update --no-cache add nodejs make gcc g++ python && \
    npm set progress=false && \
    npm install --silent --production && \
    apk del make gcc g++ python

# Expose application port
EXPOSE 8080

###########################
###### Develop stage ######
###########################

# Develop image with alias
FROM base as develop

# Add environment vars for development mode
ENV NODE_ENV=development

# Install npm development dependencies
RUN npm set progress=false && \
    npm install --silent

# Copy source files
COPY ./ /code

# Build application
RUN npm run build

#########################
##### Release stage #####
#########################

# Release image with alias
FROM base as release

# Add environment vars for production
ENV NODE_ENV=production

# Copy only required files to run the production application
COPY --from=develop /code/build /code/build

# Remove useless files
RUN rm -rf /code/package-lock.json

# Create dedicated user to not run the application as root (security best practice)
RUN adduser -D -h /code -u 5000 myuser && \
    chown -R myuser:myuser /code

USER myuser

# Define entrypoint
ENTRYPOINT ["npm", "run"]

# Define default command
CMD ["start"]
