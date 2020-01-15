# ng Connect v2.7

This repository contains all Angular code for the Connect Environment.

## Getting Started

To get started coding in Connect, use the steps below to prepare your environment. **Do not skip these steps. Doing so could cause issues.**

1.  Download and Install Node.js (Always use LTS version)

    [Node JS Link](https://nodejs.org/dist/v8.11.2/node-v8.11.2-x64.msi)

2.  Download and Install Git on your machine

    [Git Link](https://git-scm.com/downloads)

3.  Install Yarn

    ```sh
    npm i yarn -g
    ```

4.  Install Gulp CLI

    ```sh
    yarn add global gulp-cli@latest
    ```

5.  Install ngConnect Development Dependencies

    ```sh
    yarn install
    ```

This completes the setup for your development environment.

## Building the Project

ngConnect relies on TFS and Gulp for builds. There are two main tasks configured in Gulp to assist with building the project. These builds can be triggered from TFS. Use the steps below as a guide to building your project.

1. Save and Commit all changes made.
2. Run a sync to push and pull changes from your branch.
3. Once the code is in TFS, navigate to the Builds and Releases tab.
4. Run the development build
5. Use the release definition that contains your development server to kick off a deployment.

These steps can be automated, and will be once environments are properly configured.


## Git Strategy
For simplicity, we have adopted our own flavor of Microsoft's 'Release Flow' Git strategy. This strategy provides us simplicity and a ton of flexability.

The key points to highlight are:
- We do not deploy changes to production to test them before merging pull requests.
- We do not deploy to production when all pull requests are merged.
- All code changes are done inside a topic/feature branch
- Commit early and avoid long-running feature branches

Below is a modified snippet of Microsoft's article regarding Release Flow. I have modified this to accomodate our environments and practices.

## Branches
The first step when a developer wants to fix a bug or implement a feature is to create a new branch off of the master. Thanks to Git's lightweight branching model, we create these short-lived "topic" branches any and every time we want to write some code. Developers **should** commit early and often while also avoiding long-running feature branches.

**Branch naming convention:**

{2 Initials}/{BranchTitle}

Example: MG/WrongHeadshot

>The main thing to take away from this, is that every branch should be prefixed with the developers initials. Keep initials to 2 letters so they dont unnecessarily extend the branch name. As long as the initials are there, the name doesn't matter as long as it makes sense to you. The initials are mainly to allow other developers to easily identify their own remote branches.


## Push

## Pull Request

## Merge

## Release at Sprint Milestones

## Releasing Hotfixes

