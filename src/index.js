import React from 'react'
import ReactDOM from 'react-dom'
import { Observable } from 'rxjs';
import { createStore, combineReducers, applyMiddleware } from 'redux'
import { createEpicMiddleware, combineEpics } from 'redux-observable';
import { Machine, matchesState } from 'xstate';

const machine = Machine({
    initial: 'Init',
    states: {
        Init: {
            on: {
                FETCH_DATA_CLICKED: 'FetchingData',
            },
            initial: 'NoData',
            states: {
                ShowData: {},
                Error: {},
                NoData: {}
            }
        },
        FetchingData: {
            on: {
                FETCH_DATA_SUCCESS: 'Init.ShowData',
                FETCH_DATA_FAILURE: 'Init.Error',
                CLICKED_CANCEL: 'Init.NoData',
            },
            onEntry: 'FETCH_DATA_REQUEST',
            onExit: 'FETCH_DATA_CANCEL',
        },
    }
});

function handleFetchDataRequest(action$, store) {
    return action$.ofType('FETCH_DATA_REQUEST')
        .mergeMap(action =>
            Observable.of(null)
                .delay(5000)
                .mapTo({ type: 'FETCH_DATA_SUCCESS' })
                .takeUntil(action$.ofType('FETCH_DATA_CANCEL'))
        )
}

function getStatechartValue(state) {
    return state.statechart.value;
}

function getStatechart(state) {
    return state.statechart;
}

function getStatechartExit(state) {
    return state.statechart.effects.exit;
}
function getStatechartEntry(state) {
    return state.statechart.effects.entry;
}

function statechartReducer(state = machine.initial, action) {
    const nextState = machine.transition(state, action.type);
    if (nextState) {
        return nextState.value;
    } else {
        return state;
    }
}

const rootEpic = combineEpics(
    handleFetchDataRequest
)

const epicMiddleware = createEpicMiddleware(rootEpic);

const UPDATE = '@@statechart/UPDATE';
const statechartsMiddleware = store => next => action => {
    const state = store.getState();
    const statechart = getStatechart(state)
    const nextMachine = machine.transition(statechart, action.type);

    if (!nextMachine) {
        return next(action);
    }

    // run actions
    if(nextMachine.actions.length > 0) {
        nextMachine.actions.forEach(actionType =>
            store.dispatch({ type: actionType, payload: action.payload }))

          // save current statechart
          if (nextMachine && action.type !== UPDATE) {
            if (nextMachine.history !== undefined) {
              // if there's a history, it means a transition happened
              store.dispatch({ type: UPDATE, payload: nextMachine.value })
            }
          }
        }

    return next(action);
}

const rootReducer = combineReducers({
    statechart: statechartReducer
});
const store = createStore(
    rootReducer,
    applyMiddleware(
        statechartsMiddleware,
        epicMiddleware
    )
);

const rootEl = document.getElementById('root')

const render = () => {
    // console.log(matchesState('Init', getStatechart(store.getState())))
    return ReactDOM.render(
      <div>
          {JSON.stringify(store.getState())}
          <br />

          <button onClick={() => store.dispatch({ type: 'FETCH_DATA_CLICKED' })}>fetch data</button>
          <button onClick={() => store.dispatch({ type: 'CLICKED_CANCEL' })}>cancel</button>
      </div>,
      rootEl
  )
}

render()
store.subscribe(render)
