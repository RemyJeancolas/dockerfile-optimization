# Dockerfile optimization

[![Build Status](https://travis-ci.org/RemyJeancolas/dockerfile-optimization.svg?branch=master)](https://travis-ci.org/RemyJeancolas/dockerfile-optimization)
[![Coverage Status](https://coveralls.io/repos/github/RemyJeancolas/dockerfile-optimization/badge.svg)](https://coveralls.io/github/RemyJeancolas/dockerfile-optimization)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Example project showing how to optimize your Dockerfile to reduce your final docker image size.

## Table of Contents

* [Introduction](#introduction)
* [The example application](#the-example-application)
    * [Source code](#source-code)
    * [Dependencies](#dependencies)
* [Let's get started](#lets-get-started)
    * [Step 1: Basic Dockerfile](#step-1-basic-dockerfile)
    * [Step 2: Use a smaller base image](#step-2-use-a-smaller-base-image)
    * [Step 3: Remove useless packages and tools](#step-3-remove-useless-packages-and-tools)
    * [Step 4: Use multi-stage builds](#step-4-use-multi-stage-builds)
    * [Step 5: Keep only the essential](#step-5-keep-only-the-essential)
* [Conclusion](#conclusion)

## tl;dr

For ~~lazy people~~ people whose time is precious, the final version of the Dockerfile is [**here**](./dockerfiles/v5/Dockerfile).  
You can also jump to the [**conclusion**](#conclusion) for a list of best practices.

## Introduction

[Docker](https://www.docker.com/) is an amazing invention which allows all developers to set up an entire stack on any computer in minutes.  
It's popularity never stops increasing, and unless you where leaving on another planet during the last 5 years, you must have heard of it.
  
However, despite the ease of docker installation and configuration, I'm hearing more and more developers complaining about the large size of the images they get for their applications. By the way, if you are reading this, you may have the same concerns.  

The purpose of this repo is to show how to optimize your Dockerfile to output a reasonably sized Docker image, without impacting the performance of your application.  

To illustrate, we will use a very simple [Node.js](https://nodejs.org) application (an HTTP server implementing the famous "Hello World"), written in [Typescript](https://www.typescriptlang.org/), which will allow us to test the integration with compilation and tests tools.  

We will start with a basic Dockerfile, then try to optimize it in several steps.

## The example application

As said previously, we will illustrate our tutorial using a basic Node.js application.

### Source code

The source code is available in the [src](./src) folder and is composed of two main files:

1. [`index.ts`](./src/index.ts) (entry point): Application bootstrap and New Relic integration
2. [`App.ts`](./src/App.ts): Actual web server, with logger and one route to display an "Hello World" message

### Dependencies

#### Development
This application is written in Typescript, so we will need the compilation tools for this language.  
As we are civilized people, we will also use a [linter](https://www.npmjs.com/package/tslint) and write [unit tests](https://en.wikipedia.org/wiki/Unit_testing) to make sure our code is "clean".  
All of these modules are only needed at development time and are therefore installed as [`devDependencies`](https://docs.npmjs.com/files/package.json#devdependencies) (see [`package.json`](./package.json#L43)).
 
#### Production

To run in production, our application will only need two npm modules:

1. [Restify](http://restify.com/): A simple web server
2. [New Relic](https://newrelic.com/): A tool that will allow us to follow the performance of our application when deployed  
(I precise that they did not pay me to include their module here, I just find it very useful. Moreover it will present some additional challenges when writing the Dockerfile, which is relevant here to cover a maximum of use cases)

## Let's get started

### Step 1: Basic Dockerfile

The first version of the Dockerfile can be found [here](./dockerfiles/v1/Dockerfile). It only contains basic docker commands and every line is commented for clarity.  

#### Build

Let's build our image based on this Dockerfile (it may take several minutes depending on your computer and your Internet connection).  
If you have [`npm`](https://www.npmjs.com/) installed locally, you can run the following command:
```bash
npm run build:docker:v1
```
Else you can use the following command:  
```bash
docker build --no-cache --force-rm --tag docker-optimization-v1 --file ./dockerfiles/v1/Dockerfile .
```

#### Test

Our first image is built, let's test that it works properly.  

If you have `npm` installed locally, just run `npm run docker:v1`, otherwise run `docker run -i -t -p=8080:8080 --rm --name docker-optimization-v1 docker-optimization-v1`.  

You can now go to [http://localhost:8080](http://localhost:8080), if everything is working, you should see the following content:
```
"Hello World !"
```

#### Improvements

Everything is working properly, let's take a look at the image size by running `docker images | grep docker-optimization-v1`.  
This is what I get when running this command locally:
```
REPOSITORY                        TAG                 IMAGE ID            CREATED             SIZE
docker-optimization-v1            latest              f968e4e7f90a        2 minutes ago       859MB
```

**859MB** for an application that just displays "Hello World !", it seems a bit excessive...  
The reason for this is simple: if you look at the first line of our [Dockerfile](./dockerfiles/v1/Dockerfile#L2), you will see that we create our image based on the docker image `node:8`.  
By running `docker images | grep node`, we find out that this image has a size of **673MB** (at the time I write this tutorial). So just by creating our Dockerfile based on this image we have a huge final image for nothing.  

Let's try to use a smaller base image in the next step.

### Step 2: Use a smaller base image

The second version of the Dockerfile can be found [here](./dockerfiles/v2/Dockerfile). Compared to the first version, we use [`alpine:3.7`](https://hub.docker.com/_/alpine/) as base image.  
Alpine has a size of **4.15MB** so it should make a difference in our final size.

#### Build

As previously, if you have `npm` installed locally, you can run the following command:
```bash
npm run build:docker:v2
```
Else you can use the following command:  
```bash
docker build --no-cache --force-rm --tag docker-optimization-v2 --file ./dockerfiles/v2/Dockerfile .
```

#### Test

To test that our second image works properly, first stop the previous running image using `CTRL+C`, then run `npm run docker:v2` if you have `npm` installed locally, otherwise run `docker run -i -t -p=8080:8080 --rm --name docker-optimization-v2 docker-optimization-v2`.  

If you go to [http://localhost:8080](http://localhost:8080), you should see the same result as before.

#### Improvements

By running `docker images | grep docker-optimization-v2`, we can see that the final image size decreased:
```
REPOSITORY                        TAG                 IMAGE ID            CREATED             SIZE
docker-optimization-v2            latest              e362da63732b        7 minutes ago       412MB
```

This is certainly better, but still, **412MB** for a "Hello World !" remains heavy.  

Another optimization to reduce the final size of our image could be to remove unnecessary packages in production.  
Indeed all the npm packages listed in [`devDependencies`](./package.json#L43) are useless in production.  
In addition, the [`make gcc g ++ python`](./dockerfiles/v2/Dockerfile#L6) packages are useful when installing the New Relic module, but not necessary later.  

Let's try to delete all of this in the next step.

### Step 3: Remove useless packages and tools

In this step we will try to remove every useless package and/or module for production.  
The third version of the Dockerfile can be found [here](./dockerfiles/v3/Dockerfile). The difference with the previous version is [here](./dockerfiles/v3/Dockerfile#L21).

#### Build

You know it now, if you have `npm` installed locally, you can run the following command:
```bash
npm run build:docker:v3
```
Else you can use the following command:  
```bash
docker build --no-cache --force-rm --tag docker-optimization-v3 --file ./dockerfiles/v3/Dockerfile .
```

#### Test

To test that our third image works properly, first stop the previous running image using `CTRL+C`, then run `npm run docker:v3` if you have `npm` installed locally, otherwise run `docker run -i -t -p=8080:8080 --rm --name docker-optimization-v3 docker-optimization-v3`.  

If you go to [http://localhost:8080](http://localhost:8080), you should see the same result as before.

#### Improvements

By running `docker images | grep docker-optimization-v3`, we can see that the final image size decreased again:
```
REPOSITORY                        TAG                 IMAGE ID            CREATED             SIZE
docker-optimization-v3            latest              90e8a0ef83a4        3 minutes ago       340MB
```

Great, we earned another **72MB**, however **340MB** is still big.  

In addition we introduced a new problem: in the Dockerfile, you can see [here](./dockerfiles/v3/Dockerfile#L25) that we are deleting all unnecessary files for the final container.  
However we must explicitly list all these files, if our project evolves and includes new files that will have to be ignored in production, we will need to change the Dockerfile for each new file to ignore. Not great for maintainability...  

It would be a good idea to only **include** the files that we need for production instead of **excluding** the files we don't need.  
This is what we will do in the next step using the docker fancy feature of the moment: **multi-stage builds**.

### Step 4: Use multi-stage builds

We have already reduced the size of our final image from 859MB to 340MB (60% off). It's not bad, however in this step we will move up a gear.  
Since version *17.05*, Docker has a new feature named [**multi-stage builds**](https://docs.docker.com/develop/develop-images/multistage-build/). This will allow us to create intermediate docker images, then take only what we need from them to build our final image.  

You can see an example implementation in the [fourth version of the Dockerfile](./dockerfiles/v4/Dockerfile).

#### Build

As always, if you have `npm` installed locally, you can run the following command:
```bash
npm run build:docker:v4
```
Else you can use the following command:  
```bash
docker build --no-cache --force-rm --tag docker-optimization-v4 --file ./dockerfiles/v4/Dockerfile .
```

#### Test

To test that our fourth image works properly, first stop the previous running image using `CTRL+C`, then run `npm run docker:v4` if you have `npm` installed locally, otherwise run `docker run -i -t -p=8080:8080 --rm --name docker-optimization-v4 docker-optimization-v4`.  

If you go to [http://localhost:8080](http://localhost:8080), you should see the same result as before.

#### Improvements

By running `docker images | grep docker-optimization-v4`, we can see that the final image size decreased again:
```
REPOSITORY                        TAG                 IMAGE ID            CREATED             SIZE
docker-optimization-v4            latest              85be6c4bffb9        3 seconds ago       83.3MB
```

Now we're talking, **83.3MB** is a 90% size reduction compared to the initial image size ! But what exactly did we do ?  

As you can see in the Dockerfile, we use the Docker multi-stage builds by creating 2 intermediate images ([`base`](./dockerfiles/v4/Dockerfile#L6) and [`develop`](./dockerfiles/v4/Dockerfile#L28)).  
In the `base` image, we install the required packages, as well as the production dependencies, then we remove all the useless stuff. We do all this in one step to [**minimize the number of layers**](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#minimize-the-number-of-layers).  
In the `develop` image, we install the development dependencies and compile the application.  
Then in the final [`release`](./dockerfiles/v4/Dockerfile#L48) image, we take everything from `base`, then only copy the `build` folder from the `develop` image, nothing more.  

The current Dockerfile is more readable, creates a much lighter final image, and follows the Docker multi-stage builds best practices.  
However there are still some minor changes that we can implement in the last step.

### Step 5: Keep only the essential

#### Last issues

We implemented multi-stage builds in the previous step and reduced the size of our image by 90% from its original size.  
There are, however, two small things we can improve:

1. In the previous Dockerfile, we install the applications and npm modules needed for production, and then remove all unnecessary applications in one layer to optimize the size of the `base` image.  
However, the `develop` image is based on the `base` image, and thus no longer has access to the "make gcc g ++ python" packages.  
In our case this is not a problem, but to prevent a problem in another project, these packages should be accessible for the `develop` image if it needs them.

2. We still have an extra layer in the `release` image that we could get rid of ([here](./dockerfiles/v4/Dockerfile#L57), it's not much, but hey, we're talking about optimization aren't we?)

#### Last fixes

We could fix the first issue above by reinstalling the "make gcc g ++ python" packages in the `develop` image, but we just removed them at the end of the `base` image, not very nice...  

An elegant way to solve this problem is to use an additional intermediate image that we can name [`dependencies`](./dockerfiles/v5/Dockerfile#L25). This image will have these packages installed and will take care of installing the npm modules for production (example [here](./dockerfiles/v5/Dockerfile#L31)).  

Finally we only install these packages once, they are used to build the production dependencies and available for the `develop` image if needed.  
We just have to copy the `node_modules` folder from the `dependencies` image into the `release` image (example [here](./dockerfiles/v5/Dockerfile#L66)).  
First issue solved.  

The second issue is fixed by the first one, indeed adding an extra `dependencies` image, the `package-lock.json` is no longer part of the `base` image, we can then get rid of the `RUN rm -rf /code/package-lock.json` line.  
Second issue solved.

The final Dockerfile is available [here](./dockerfiles/v5/Dockerfile).

#### Build

Last but not least, if you have `npm` installed locally, you can run the following command:
```bash
npm run build:docker:v5
```
Else you can use the following command:  
```bash
docker build --no-cache --force-rm --tag docker-optimization-v5 --file ./dockerfiles/v5/Dockerfile .
```

#### Test

To test that our fifth image works properly, first stop the previous running image using `CTRL+C`, then run `npm run docker:v5` if you have `npm` installed locally, otherwise run `docker run -i -t -p=8080:8080 --rm --name docker-optimization-v5 docker-optimization-v5`.  

If you go to [http://localhost:8080](http://localhost:8080), you should see the same result as before.

#### Improvements

By running `docker images | grep docker-optimization-v5`, we can see that the final image size decreased again:
```
REPOSITORY                        TAG                 IMAGE ID            CREATED             SIZE
docker-optimization-v5            latest              3ef89989ec3e        30 minutes ago      76.4MB
```

Final size: **76.4MB**, it represents a **91% reduction size** compared to the beginning.

## Conclusion

It is quite possible to have functional applications while maintaining docker images of reasonable size, provided you use the following principles:

* Use the smallest docker image that fits your needs (eg: [alpine](https://hub.docker.com/_/alpine/)).
* Remember to remove packages/tools unused in production.
* Use [docker multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/).
* Try to [minimize the number of layers](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#minimize-the-number-of-layers) in your Dockerfile for each stage.
* For other improvements, refer to the [best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) recommended by the docker team, these are regularly updated.
* In order to verify that your Dockerfile follows the standards, you can use [FROM:latest](https://www.fromlatest.io) which is an online Dockerfile validator. It does not yet support validation of multi-stage builds, but provides other useful tips.
