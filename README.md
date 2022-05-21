# llm-in-a-box

Run large language models in AWS. The setup is as follows:

- [CDK][cdk] scripts to generate the AWS infrastructure
- The application itself is two tiered:
  - A small server for managing requests and sending tasks to a
    machine with a GPU
  - A worker for doing actual model predictions. It is intended to be
    run on spot instances.

## Running a local test server

To run a local server you will need Docker compose installed. Then do

```
make run-server
```

Once the server is up, you can submit a sample prompt by doing

```
curl --header "Content-Type: application/json" \
     --request POST \
     --data '{"prompt": "hello, world!"}' \
     localhost:8000/completions
```

You can also run

```
make run-server-chaotic
```

This will continually ping the server while randomly restarting the
worker in the background.

## Running tests

You can run lint checks by doing

```
make lint
```

[cdk]: https://aws.amazon.com/cdk/