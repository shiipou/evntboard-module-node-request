import 'dotenv/config'
import {JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient} from 'json-rpc-2.0'
import {v4 as uuid} from 'uuid'
import { WebSocket } from 'ws'
import axios from 'axios'

import {EVNTBOARD_HOST, MODULE_CODE, MODULE_NAME, MODULE_TOKEN} from './constant'

const main = async () => {

  if (!EVNTBOARD_HOST) {
    throw new Error("EVNTBOARD_HOST not set")
  }

  if (!MODULE_NAME) {
    throw new Error("MODULE_NAME not set")
  }

  if (!MODULE_TOKEN) {
    throw new Error("MODULE_TOKEN not set")
  }

  let ws: WebSocket

  const serverAndClient = new JSONRPCServerAndClient(
    new JSONRPCServer(),
    new JSONRPCClient((request) => {
      try {
        ws.send(JSON.stringify(request))
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    }, () => uuid())
  )

  ws = new WebSocket(EVNTBOARD_HOST)

  ws.onopen = async () => {
    const result = await serverAndClient.request('session.register', {
      code: MODULE_CODE,
      name: MODULE_NAME,
      token: MODULE_TOKEN
    })

    serverAndClient.addMethod('get', async ({ url, headers }) => {
      const response = await axios.get(url, { headers })
      return JSON.parse(response.data)
    })

    serverAndClient.addMethod('post', async ({ url, data, headers }) => {
      const response = await axios.get(url, { data, headers })
      return JSON.parse(response.data)
    })

  }

  ws.onmessage = (event: { data: { toString: () => string } }) => {
    serverAndClient.receiveAndSend(JSON.parse(event.data.toString()))
  }

  ws.onclose = (event: { reason: any }) => {
    serverAndClient.rejectAllPendingRequests(`Connection is closed (${event.reason}).`)
  }

  ws.onerror = (event: any) => {
    console.error('error a', event)
  }
}

main()
  .catch((e) => {
    console.error(e)
  })
