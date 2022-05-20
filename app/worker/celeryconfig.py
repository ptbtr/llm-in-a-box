broker_url = "redis://redis:6379/0"
result_backend = "redis://redis:6379/0"

# We load the model at worker start; give it plenty of time.
worker_proc_alive_timeout = 60
