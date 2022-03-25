import React, { useContext, useEffect, useRef, useState } from 'react'
import Token from './token'
import { store } from '../../player-store'

const TokenDrawer = (props) => {

	const manager = useContext(store)
	const dispatch = manager.dispatch

	const paginate = () => {
		dispatch({ type: 'paginate_question_forward' })
	}

	const handleTokenDragOver = (event) => {
		// Exits the function if the max number of guesses have been used
		if (props.attemptLimit > 1 && (props.attemptsUsed >= props.attemptLimit)) return false

		event.preventDefault()
	}

	const handleTokenDrop = (event) => {
		event.preventDefault()

		let dropTokenId = event.dataTransfer.getData("tokenId")
		let dropTokenName = event.dataTransfer.getData("tokenName")
		let dropTokenType = event.dataTransfer.getData("tokenType")
		let dropTokenPhraseIndex = event.dataTransfer.getData("tokenPhraseIndex")
		let dropTokenStatus = event.dataTransfer.getData("tokenStatus")
		let dropTokenFakeout = (event.dataTransfer.getData("tokenFakeout") == "true") ? true : false

		if (dropTokenStatus == "sorted") {
			dispatch({
				type: 'sorted_token_unsort', payload: {
					origin: dropTokenStatus,
					tokenIndex: parseInt(dropTokenPhraseIndex),
					questionIndex: manager.state.currentIndex,
					fakeout: dropTokenFakeout,
					legend: dropTokenType,
					value: dropTokenName,
					id: dropTokenId
				}
			})
		}
	}

	const handleCheckAnswer = () => {
		let item = manager.state.items[manager.state.currentIndex]

		// attempt limit already reached, assume call is invalid
		if (props.responseState == 'incorrect-no-attempts') return

		let response = verify(item)
		let state = 'none'

		if (!response) {
			if ((props.attemptLimit - 1) > props.attemptsUsed) {
				state = 'incorrect-attempts-remaining'
			}
			else {
				state = 'incorrect-no-attempts'
			}
		}
		else {
			state = 'correct'
		}

		dispatch({
			type: 'attempt_submit', payload: {
				questionIndex: manager.state.currentIndex,
				response: state
			}
		})
	}

	const verify = (item) => {

		if (item.sorted.length != item.correctPhrase.length) {
			return false
		}

		for (let i = 0; i < item.sorted.length; i++) {

			if (item.displayPref == 'word') {
				if (item.sorted[i].value != item.correctPhrase[i].value || item.sorted[i].legend != item.sorted[i].legend) return false
			}
			else if (item.displayPref == 'legend') {
				if (item.sorted[i].legend != item.correctPhrase[i].legend) return false
			}
		}
		return true
	}

	let tokenList = props.phrase?.map((token, index) => {
		return <Token
			id={token.id}
			key={index}
			index={index}
			type={token.legend}
			value={token.value}
			pref={props.displayPref}
			status={token.status}
			fakeout={token.fakeout}
			dragEligible={!(props.attemptsUsed >= props.attemptLimit)}>
		</Token>
	})

	let isLastQuestion = manager.state.currentIndex == manager.state.items.length - 1

	let currentResponseText = ''

	let remaining = props.attemptLimit - props.attemptsUsed

	switch (props.responseState) {
		case 'ready':
			if (isLastQuestion && remaining > 0) {
				currentResponseText = <span className='controls-message'>You have <span className='strong'>{remaining}</span> attempt{remaining > 1 ? 's' : ''} remaining. Select <span className='strong'>Check Answer</span> to check your answer, or select <span className='strong'>Submit</span> at the top-right for scoring.</span>
			}
			else if (isLastQuestion) {
				currentResponseText = <span className='controls-message'>When you're ready, select <span className='strong'>Submit</span> at the top-right for scoring or go back and review your answers.</span>
			}
			else {
				currentResponseText = <span className='controls-message'>You have <span className='strong'>{remaining}</span> attempt{remaining > 1 ? 's' : ''} remaining. Select <span className='strong'>Check Answer</span> to check your answer, or select <span className='strong'>Next Question</span> to continue.</span>
			}
			break

		case 'pending':
			currentResponseText = <span>PENDING</span>
			break

		case 'incorrect-attempts-remaining':
			currentResponseText = <span className='controls-message'>That's not quite right. You have <span className='strong'>{remaining}</span> attempt{remaining > 1 ? 's' : ''} remaining.</span>
			break

		case 'incorrect-no-attempts':
			if (isLastQuestion) {
				currentResponseText = <span className='controls-message'>That's not quite right. You've exhausted your attempts for this question. When you're ready, select <span className='strong'>Submit</span> at the top-right for scoring or go back and review your answers.</span>
			}
			else {
				currentResponseText = <span className='controls-message'>That's not quite right. You've exhausted your attempts for this question. Select <span className='strong'>Next Question</span> to continue.</span>
			}
			break

		case 'correct':
			if (isLastQuestion) {
				currentResponseText = <span className='controls-message'>Nice work! You aced it. When you're ready, select <span className='strong'>Submit</span> at the top-right for scoring or go back and review your answers.</span>
			}
			else {
				currentResponseText = <span className='controls-message'>Nice work! You aced it. Select <span className='strong'>Next Question</span> to continue.</span>
			}
			break

		case 'none':
		default:
			currentResponseText = <span>NONE</span>
			break
	}

	return (
		<section className={'token-drawer ' +
			`${(props.phrase?.length == 0) ? 'empty ' : ''}` +
			`${props.responseState} ` +
			`${props.hasFakes ? 'has-fakes ' : ''}`}
			onDragOver={handleTokenDragOver}
			onDrop={handleTokenDrop}>
			{tokenList}
			<section className='response-controls'>
				<div className='response-message-container'>
					{currentResponseText}
				</div>
				<div className='button-container'>
					<button className={`verify ${props.attemptLimit > props.attemptsUsed && props.responseState != 'correct' ? 'show' : ''}`} onClick={handleCheckAnswer}>Check Answer</button>
					<button className={`paginate ${!isLastQuestion ? 'show' : ''}`} onClick={paginate}>Next Question</button>
				</div>
			</section>
		</section>
	)
}

export default TokenDrawer