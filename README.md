# slack-milk

Fetch all conversations from Slack workspace.

## Install

```bash
npm install -g slack-milk
```

## Usage

 1. Create app from [Your Apps - slack api](https://api.slack.com/apps)

 2. Create Bot User OAuth Token with these scopes.

    - channels:history
    - channels:read
    - files:read
    - groups:history
    - groups:read
    - users:read

 3. Install to your workspace.

 4. Add this app to all channels to fetch.

 5. Run

    ```shell
    SLACK_TOKEN=<OAuth Token> slack-milk -o <directory>
    ```

## Output structure

- channels/
  - (Channel ID)/
    - messages/
      - (Message Timestamp)/
        - (Message Timestamp)/
          - files/
          - message.json (see [format](https://api.slack.com/methods/conversations.replies))
    - channel.json (see [format](https://api.slack.com/methods/conversations.list))
- users/
  - (User ID)/
    - files/
    - user.json (see [format](https://api.slack.com/methods/users.list))
