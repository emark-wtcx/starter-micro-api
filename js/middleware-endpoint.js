export default defineComponent({
    async run({ steps, $ }) {
      const headers = {}
  
      const bodyContent = {
        "pushNotificationText":steps.trigger.event.body.inArguments[0].message
      }
      const url = steps.trigger.event.body.inArguments[0].endpoint
      
      await $.respond({
        status: 200,
        headers,
        bodyContent
      }).then(
      fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: bodyContent
    }).then(response => response.json())
    .then(response => console.log(JSON.stringify(response)))
      )
    },
  })