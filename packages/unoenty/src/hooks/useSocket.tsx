import { useSocketStore } from "@/store/Socket"

import {
	PlayerData,
	Game,
	PlayerState,
	GameEvents
} from "@uno-game/protocols"

const useSocket = () => {
	const socketStore = useSocketStore()

	const getCurrentPlayer = (): PlayerData => {
		const playerId = socketStore.playerId

		const player = socketStore?.game?.players?.find(player => player.id === playerId)

		return player as PlayerData
	}

	const getOtherPlayers = (): PlayerData[] => {
		const playerId = socketStore.playerId

		const currentPlayerIndex = socketStore?.game?.players?.
			findIndex(player => player.id === playerId) || 0

		const otherPlayersBeforeCurrentPlayer = socketStore?.game?.players?.
			slice(0, currentPlayerIndex)

		const otherPlayersAfterCurrentPlayer = socketStore?.game?.players?.
			slice(currentPlayerIndex + 1, socketStore?.game?.players?.length)

		let otherPlayers = [
			...otherPlayersAfterCurrentPlayer || [],
			...otherPlayersBeforeCurrentPlayer || []
		]

		/**
		 * Improves layout location
		 */
		if (otherPlayers.length <= 4) {
			otherPlayers = [
				otherPlayers[0],
				{} as any,
				otherPlayers[1],
				{} as any,
				otherPlayers[2],
				{} as any,
				otherPlayers[3]
			]
		}

		return (otherPlayers || []) as PlayerData[]
	}

	const createGame = async (): Promise<Game> => {
		socketStore.io.emit("CreateGame")

		const game = await new Promise<Game>(resolve => {
			socketStore.io.on("GameCreated", (game: Game) => {
				resolve(game)
			})
		})

		return game
	}

	const joinGame = async (gameId: string): Promise<Game> => {
		socketStore.io.emit("JoinGame", gameId)

		const game = await new Promise<Game>((resolve) => {
			socketStore.io.on("PlayerJoined", resolve)
		})

		socketStore.set({ game })

		return game
	}

	const toggleReady = (gameId: string) => {
		socketStore.io.emit("ToggleReady", gameId)
	}

	const buyCard = (gameId: string) => {
		socketStore.io.emit("BuyCard", gameId)
	}

	const putCard = (gameId: string, cardId: string[]) => {
		socketStore.io.emit("PutCard", gameId, cardId)
	}

	const onGameStart = (fn: Function) => {
		socketStore.io.on("GameStarted", fn)
	}

	const onPlayerWon = (fn: (playerId: string, playerName: string) => void) => {
		socketStore.io.on("PlayerWon", fn)
	}

	const onCardStackBuyCardsCombo = (fn: (amountToBuy: number) => void) => {
		socketStore.io.on("CardStackBuyCardsCombo", fn)
	}

	const onPlayerStateChange = (fn: (playerState: PlayerState, playerId: string, amountToBuy?: number) => void) => {
		const events: { [key in GameEvents]?: PlayerState } = {
			"PlayerUno": "Uno",
			"PlayerBlocked": "Blocked",
			"PlayerBuyCards": "BuyCards"
		}

		Object.entries(events)
			.forEach(([event, playerState]) => {
				socketStore.io.on(event, (playerId: string, amountToBuy?: number) => {
					if (playerState) {
						fn(playerState, playerId, amountToBuy)
					}
				})
			})
	}

	return {
		get currentPlayer (): PlayerData {
			return getCurrentPlayer()
		},
		get otherPlayers (): PlayerData[] {
			return getOtherPlayers()
		},
		createGame,
		joinGame,
		onGameStart,
		onPlayerWon,
		onPlayerStateChange,
		onCardStackBuyCardsCombo,
		toggleReady,
		buyCard,
		putCard
	}
}

export default useSocket
