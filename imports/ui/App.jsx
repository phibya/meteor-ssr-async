import React, {useState, useEffect} from 'react'
import {useLocation} from "react-router-dom";

const useServerState = (defaultValue, method, args) => {
    let [state, setState] = useState(defaultValue)
    const key = JSON.stringify({method, args})

    if (Meteor.isServer) {
        const location = useLocation()
        const routerState = location.state.values
        const callAsync = location.state.callAsync

        if (routerState.has(key)) {
            state = routerState.get(key)
        } else {
            callAsync(method, args)
        }
    } else {
        useEffect(() => {
            const ssrState = window.__SSR_STATE__ || {}

            if (ssrState[key]) {
                setState(ssrState[key])
                return
            }

            Meteor.callAsync(method, args).then(setState)
        }, [method, args]);
    }

    return [state, setState]
}

const Child = ({message}) => {

    const [message2, _] = useServerState("ChildClient", "hello", message + " - ChildServer");
    console.log(message2)

    return (
        <div>
            <p>{message2}</p>
        </div>
    )
}

export const App = () => {
    const [message, _] = useServerState("ParentClient", "hello", "ParentServer");
    console.log(message)

    return (
        <div>
            <p>{message}</p>
            <Child message={message}/>
        </div>
    );
}
