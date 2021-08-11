## Docker Compose

- Copy `docker-compose` execution to `/usr/local/bin/docker-compose`
- Add permission to execute
    ```bash
    sudo chmod +x /usr/local/bin/docker-compose
    ```
- Create symbolic link
    ```bash
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
    ```
- Copy completion script to `/etc/bash_completion.d/docker-compose`