# llm-in-a-box

## Local test server

To run a local test server, do

```
make run-dev-server
```

Once the server is up, you can submit a sample prompt by doing

```
curl --header "Content-Type: application/json" \
     --request POST \
     --data '{"prompt": "hello, world"}' \
     localhost:8000/generate
```