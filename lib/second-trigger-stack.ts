// import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
// import { CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
// import { GitHubSourceActionProps, GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild';
import { CodeBuildAction, GitHubSourceAction, GitHubSourceActionProps } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import { SecretValue, Stack, StackProps } from 'aws-cdk-lib/core/lib';

export class SecondTriggerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'second-trigger-pipeline', {
      pipelineName: 'second-trigger-pipeline',
    });

    // Define Artifact for GitHub Source Action
    const sourceOutput = new Artifact('SourceOutput');

    const oauth = SecretValue.secretsManager('github-token')

    // Define GitHub source action with oauthToken
    const synthSourceActionProps: GitHubSourceActionProps = {
      actionName: 'SynthSource',
      owner: 'halitos',
      repo: 'second-trigger-pipeline',
      branch: 'main',
      output: sourceOutput,
      oauthToken: oauth,
    };

    const synthSourceAction = new GitHubSourceAction(synthSourceActionProps);

    // Add synth source action to the first stage of the pipeline
    pipeline.addStage({
      stageName: 'Source',
      actions: [synthSourceAction],
    });

    // Define CodeBuild action for synth step
    const synthProject = new PipelineProject(this, 'SynthProject', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm ci'],
          },
          build: {
            commands: ['npx cdk synth --quiet'],
          },
        },
      }),
    });

    const synthAction = new CodeBuildAction({
      actionName: 'SynthAction',
      input: sourceOutput, // Use the output from the GitHubSourceAction
      project: synthProject,
    });

    // Add synth action to the second stage of the pipeline
    pipeline.addStage({
      stageName: 'Build',
      actions: [synthAction],
    });

    // // Use CodeBuildAction for other steps
    // const testProject = new PipelineProject(this, 'TestProject', {
    //   buildSpec: BuildSpec.fromObject({
    //     version: '0.2',
    //     phases: {
    //       build: {
    //         commands: ['npm run test'],
    //       },
    //     },
    //   }),
    //   // Configure your CodeBuild project for testing
    // });

    // const testAction = new CodeBuildAction({
    //   actionName: 'TestAction',
    //   input: sourceOutput, // Use the output from the GitHubSourceAction
    //   project: testProject,
    //   // Add other action configuration as needed
    // });

    // // Add test action to the third stage of the pipeline
    // pipeline.addStage({
    //   stageName: 'Test',
    //   actions: [testAction],
    // });
  }
}