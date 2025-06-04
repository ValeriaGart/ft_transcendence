
# setting up dev container
this website helped understanding, but in the end the tutorial is not needed since devcontainer extension will guide the user through setting it up step by step
https://code.visualstudio.com/docs/devcontainers/create-dev-container

just install "dev containers", call the command "Dev Containers: Reopen in Container" and follow the instructions to create a new setup. 

the ./devcontainer/devcontainer.json needs to be at the root of the directory and there can be only one. That's why I saved a duplicate with my backend config as devcontainer.backend.json. If you need your own configuration, delete the devcontainer.json and call the "reopen in container" command and let it prompt you through creating one. I suggest you also keep a copy of your config saved.

to install dependencies run `npm install` which is accessing package-lock.json in the root of the repository. then it is set up.

# setting up basic node.js server
https://www.geeksforgeeks.org/how-to-build-a-simple-web-server-with-node-js/

you can run `node index.js` to get the simplest webpage you've ever seen on your localhost.


# fastify
after setting up the dev container you can try running `node fastify2.js` (the other ones are work in progress). This will start the server on http://localhost:3000/ . from your terminal you can type some curl commands to call the API.

```
# Get all users
curl http://localhost:3000/users

# Get single user
curl http://localhost:3000/users/1

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Brown","email":"alice@example.com"}'

# Update user
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"John Smith","email":"john.smith@example.com"}'

# Delete user
curl -X DELETE http://localhost:3000/users/1
```

# sqlite
after running fastify2.js you can see that pong.db was created. You can access it with `sqlite3 pong.db` and run something like `SELECT * FROM users;`