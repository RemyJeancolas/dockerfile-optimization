##############################
##### Base partial build #####
##############################

# Base image with alias
FROM alpine:3.7 as base

# Create and define work directory
WORKDIR /code

# Install Node.js
RUN apk --update --no-cache add nodejs

# Expose application port
EXPOSE 8080

# Copy only the minimal required files
COPY package.json /code/

######################################
##### Dependencies partial build #####
######################################

# Dependencies image with alias
FROM base as dependencies

# Copy only the minimal required files
COPY package-lock.json /code/

# Update system, install dependencies, install npm production dependencies
RUN apk --update --no-cache add --virtual build-dependencies make gcc g++ python && \
    npm set progress=false && \
    npm install --silent --production

###################################
###### Develop partial build ######
###################################

# Develop image with alias
FROM dependencies as develop

# Add environment vars for development mode
ENV NODE_ENV=development

# Install npm development dependencies
RUN npm set progress=false && \
    npm install --silent

# Copy source files
COPY ./ /code

# Build application
RUN npm run build

#################################
##### Release partial build #####
#################################

# Release image with alias
FROM base as release

# Add environment vars for production
ENV NODE_ENV=production

# Copy only required files to run the production application
COPY --from=dependencies /code/node_modules /code/node_modules
COPY --from=develop /code/build /code/build

# Create dedicated user to not run the application as root (security best practice)
RUN adduser -D -h /code -u 5000 ssense && \
    chown -R ssense:ssense /code

USER ssense

# Define entrypoint
ENTRYPOINT ["npm", "run"]

# Define default command
CMD ["start"]
