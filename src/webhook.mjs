import axios from 'axios'
import 'dotenv/config'
import wsServer from './websocket.mjs'

const GITLAB_API_BASE_URL = 'https://gitlab.lnu.se/api/v4'
const projectId = process.env.GITLAB_PROJECT_ID
const personalAccessToken = process.env.GITLAB_PERSONAL_ACCESS_TOKEN
const webhookSecret = process.env.WEBHOOK_SECRET
let issues = []

const log = (message) => console.log(message)
const logError = (message) => console.error(message)

class WebhookController {
  home = async (req, res) => {
    try {
      issues = await this.fetchIssues()
      res.render('webapp', { issues })
    } catch (error) {
      logError(`Error fetching issues: ${error}`)
      res.status(500).send('Internal Server Error')
    }
  }

  post = async (req, res) => {
    const { headers, body } = req
    if (headers['x-gitlab-event'] === 'Issue Hook') {
      const action = body.object_attributes.action
      log(`Action received: ${action}`)

      const issueDetails = this.formatIssueDetails(body.object_attributes)
      this.updateIssues(issueDetails)

      const event = action === 'close' ? 'refresh_page' : 'issue_event'
      wsServer.broadcastToAll(JSON.stringify({ event, issue: issueDetails }))

      res.status(200).send('Webhook received')
    } else {
      res.status(400).send('Bad Request')
    }
  }

  validatePost = (req, res, next) => {
    const headerSignature = req.headers['x-gitlab-token']
    if (headerSignature === webhookSecret) {
      next()
    } else {
      res.status(403).send('Forbidden - Invalid webhook signature')
    }
  }

  fetchIssues = async () => {
    const url = `${GITLAB_API_BASE_URL}/projects/${projectId}/issues?state=opened`
    const headers = { 'PRIVATE-TOKEN': personalAccessToken }
    const response = await axios.get(url, { headers })
    return response.data.map(this.formatIssueDetails)
  }

  formatIssueDetails = (attributes) => ({
    id: attributes.iid,
    title: attributes.title,
    description: attributes.description,
    state: attributes.state,
    createdAt: attributes.created_at,
    updatedAt: attributes.updated_at,
    webUrl: attributes.url
  })

  updateIssues = (issueDetails) => {
    const index = issues.findIndex(issue => issue.id === issueDetails.id)
    if (index !== -1) {
      issues[index] = issueDetails
    } else {
      issues.push(issueDetails)
    }
  }
}

export default WebhookController
