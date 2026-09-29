
        const ws = new WebSocket("ws://localhost:9234/devtools/page/3F599C2B2E3EAD00091C4532B367E345");
        ws.onopen = () => {
          ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 10,
              method: "Runtime.evaluate",
              params: {
                expression: ,
                returnByValue: true
              }
            }));
          }, 2000);
        };
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === 10) {
            console.log("BUTTONS RESULT:", JSON.stringify(msg.result.result.value, null, 2));
          }
        };
        setTimeout(() => {
          ws.close();
          process.exit(0);
        }, 4000);
        