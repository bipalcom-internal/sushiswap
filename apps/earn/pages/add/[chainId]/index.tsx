import { PlusIcon } from '@heroicons/react/solid'
import { ConstantProductPool, Pair, StablePool } from '@sushiswap/amm'
import { ChainId, chainShortName } from '@sushiswap/chain'
import { defaultQuoteCurrency, Native, tryParseAmount, Type, WNATIVE_ADDRESS } from '@sushiswap/currency'
import { FundSource } from '@sushiswap/hooks'
import { AppearOnMount, BreadcrumbLink, Button, Container, Dots, Loader } from '@sushiswap/ui'
import { Widget } from '@sushiswap/ui'
import {
  Checker,
  ConstantProductPoolState,
  PairState,
  PoolFinder,
  PoolFinderType,
  StablePoolState,
  Web3Input,
} from '@sushiswap/wagmi'
import {
  AddSectionMyPosition,
  AddSectionReviewModalLegacy,
  AddSectionReviewModalTrident,
  AddSectionStake,
  FEE_MAP,
  Layout,
  PoolPositionProvider,
  PoolPositionStakedProvider,
  SelectFeeWidget,
  SelectNetworkWidget,
  SelectPoolTypeWidget,
  SettingsOverlay,
} from '../../../components'
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { SWRConfig, useSWRConfig } from 'swr'
import { isUniswapV2Router02ChainId } from '@sushiswap/sushiswap'

import { CreateSectionReviewModalTrident } from '../../../components/CreateSection'
import { AMM_ENABLED_NETWORKS, TRIDENT_ENABLED_NETWORKS } from '../../../config'
import { isConstantProductPool, isLegacyPool, isStablePool } from '../../../lib/functions'
import { useCustomTokens } from '../../../lib/state/storage'
import { useTokens } from '../../../lib/state/token-lists'
import { isBentoBoxV1ChainId } from '@sushiswap/bentobox'
import { usePool } from '@sushiswap/client'
import { SUPPORTED_CHAIN_IDS } from '../../../config'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { useRouter } from 'next/router'
import { isConstantProductPoolFactoryChainId, isStablePoolFactoryChainId } from '@sushiswap/trident'

const LINKS: BreadcrumbLink[] = [
  {
    href: `/add`,
    label: `Add`,
  },
]

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const chainId = params?.chainId ? (parseInt(params.chainId as string) as ChainId) : ChainId.ETHEREUM
  return {
    props: {
      chainId,
    },
  }
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export const getStaticPaths: GetStaticPaths = async () => {
  // Get the paths we want to pre-render based on supported chain ids
  const paths = SUPPORTED_CHAIN_IDS.map((chainId) => ({
    params: {
      chainId: chainId.toString(),
    },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: false }
}

export function Add(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  const [chainId, setChainId] = useState(props.chainId)
  const [fee, setFee] = useState(2)
  const [poolType, setPoolType] = useState(PoolFinderType.Classic)

  const [token0, setToken0] = useState<Type | undefined>(Native.onChain(chainId))
  const [token1, setToken1] = useState<Type | undefined>(
    defaultQuoteCurrency[chainId as keyof typeof defaultQuoteCurrency]
  )

  useEffect(() => {
    setToken0(Native.onChain(chainId))
    setToken1(defaultQuoteCurrency[chainId as keyof typeof defaultQuoteCurrency])
  }, [chainId])

  // Reset default fee if switching networks and not on a trident enabled network
  useEffect(() => {
    if (!TRIDENT_ENABLED_NETWORKS.includes(chainId)) {
      setFee(2)
      setPoolType(PoolFinderType.Classic)
    }
  }, [chainId])

  const tridentPoolIfCreate = TRIDENT_ENABLED_NETWORKS.includes(chainId)

  return (
    <SWRConfig>
      <Layout breadcrumbs={LINKS}>
        <div className="grid grid-cols-1 sm:grid-cols-[340px_auto] md:grid-cols-[auto_396px_264px] gap-10">
          <div className="hidden md:block" />
          <PoolFinder
            components={
              <PoolFinder.Components>
                <PoolFinder.LegacyPool
                  chainId={chainId}
                  token0={token0}
                  token1={token1}
                  enabled={isUniswapV2Router02ChainId(chainId)}
                />
                <PoolFinder.ConstantProductPool
                  chainId={chainId}
                  token0={token0}
                  token1={token1}
                  enabled={
                    isConstantProductPoolFactoryChainId(chainId) &&
                    poolType === PoolFinderType.Classic &&
                    TRIDENT_ENABLED_NETWORKS.includes(chainId)
                  }
                  fee={FEE_MAP[fee]}
                  twap={false}
                />
                <PoolFinder.StablePool
                  chainId={chainId}
                  token0={token0}
                  token1={token1}
                  enabled={
                    isStablePoolFactoryChainId(chainId) &&
                    poolType === PoolFinderType.Stable &&
                    TRIDENT_ENABLED_NETWORKS.includes(chainId)
                  }
                  fee={FEE_MAP[fee]}
                  twap={false}
                />
              </PoolFinder.Components>
            }
          >
            {({ pool: [poolState, pool] }) => {
              const title =
                !token0 || !token1 ? (
                  'Select Tokens'
                ) : [PairState.LOADING, ConstantProductPoolState.LOADING, StablePoolState.LOADING].includes(
                    poolState
                  ) ? (
                  <div className="h-[20px] flex items-center justify-center">
                    <Loader width={14} />
                  </div>
                ) : [PairState.EXISTS, ConstantProductPoolState.EXISTS, StablePoolState.EXISTS].includes(poolState) ? (
                  'Add Liquidity'
                ) : (
                  'Create Pool'
                )

              return (
                <_Add
                  chainId={chainId}
                  setChainId={(chainId) => {
                    router.push(`/add/${chainId}`, `/add/${chainId}`, { shallow: true })
                    setChainId(chainId)
                  }}
                  fee={fee}
                  setFee={setFee}
                  pool={pool}
                  poolState={poolState}
                  tridentPoolIfCreate={tridentPoolIfCreate}
                  title={title}
                  token0={token0}
                  token1={token1}
                  setToken0={setToken0}
                  setToken1={setToken1}
                  poolType={poolType}
                  setPoolType={setPoolType}
                />
              )
            }}
          </PoolFinder>
        </div>
      </Layout>
    </SWRConfig>
  )
}

interface AddProps {
  chainId: ChainId
  setChainId(chainId: ChainId): void
  fee: number
  setFee(fee: number): void
  pool: Pair | ConstantProductPool | StablePool | null
  poolState: PairState | ConstantProductPoolState | StablePoolState
  tridentPoolIfCreate: boolean
  title: ReactNode
  token0: Type | undefined
  token1: Type | undefined
  setToken0(token: Type): void
  setToken1(token: Type): void
  poolType: PoolFinderType
  setPoolType(type: PoolFinderType): void
}

const _Add: FC<AddProps> = ({
  chainId,
  setChainId,
  fee,
  setFee,
  pool,
  poolState,
  tridentPoolIfCreate,
  title,
  token0,
  token1,
  setToken0,
  setToken1,
  poolType,
  setPoolType,
}) => {
  const { data } = usePool({
    args: { chainId, address: pool?.liquidityToken.address as string },
    swrConfig: useSWRConfig(),
    shouldFetch: !!pool,
  })

  const [customTokensMap, { addCustomToken, removeCustomToken }] = useCustomTokens(chainId)
  const tokenMap = useTokens(chainId)
  const [{ input0, input1 }, setTypedAmounts] = useState<{
    input0: string
    input1: string
  }>({ input0: '', input1: '' })

  const [parsedInput0, parsedInput1] = useMemo(() => {
    return [tryParseAmount(input0, token0), tryParseAmount(input1, token1)]
  }, [input0, input1, token0, token1])

  const onChangeToken0TypedAmount = useCallback(
    (value: string) => {
      if (
        poolState === PairState.NOT_EXISTS ||
        poolState === ConstantProductPoolState.NOT_EXISTS ||
        poolState === StablePoolState.NOT_EXISTS
      ) {
        setTypedAmounts((prev) => ({
          ...prev,
          input0: value,
        }))
      } else if (token0 && pool) {
        const parsedAmount = tryParseAmount(value, token0)
        setTypedAmounts({
          input0: value,
          input1: parsedAmount ? pool.priceOf(token0.wrapped).quote(parsedAmount.wrapped).toExact() : '',
        })
      }
    },
    [pool, poolState, token0]
  )

  const onChangeToken1TypedAmount = useCallback(
    (value: string) => {
      if (
        poolState === PairState.NOT_EXISTS ||
        poolState === ConstantProductPoolState.NOT_EXISTS ||
        poolState === StablePoolState.NOT_EXISTS
      ) {
        setTypedAmounts((prev) => ({
          ...prev,
          input1: value,
        }))
      } else if (token1 && pool) {
        const parsedAmount = tryParseAmount(value, token1)
        setTypedAmounts({
          input0: parsedAmount ? pool.priceOf(token1.wrapped).quote(parsedAmount.wrapped).toExact() : '',
          input1: value,
        })
      }
    },
    [pool, poolState, token1]
  )

  useEffect(() => {
    if (pool) {
      onChangeToken0TypedAmount(input0)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChangeToken0TypedAmount])

  return (
    <>
      <div className="flex flex-col order-3 gap-3 pb-40 sm:order-2">
        <SelectNetworkWidget selectedNetwork={chainId} onSelect={setChainId} />
        <div className={!TRIDENT_ENABLED_NETWORKS.includes(chainId) ? 'opacity-40' : ''}>
          <SelectPoolTypeWidget
            selectedNetwork={chainId}
            poolType={poolType}
            setPoolType={(type) => {
              setPoolType(type)
            }}
          />
        </div>
        <div className={!TRIDENT_ENABLED_NETWORKS.includes(chainId) ? 'opacity-40' : ''}>
          <SelectFeeWidget selectedNetwork={chainId} fee={fee} setFee={setFee} />
        </div>

        <Widget id="addLiquidity" maxWidth={400}>
          <Widget.Content>
            <Widget.Header title="4. Add Liquidity">
              <SettingsOverlay />
            </Widget.Header>
            <Web3Input.Currency
              className="p-3"
              value={input0}
              onChange={onChangeToken0TypedAmount}
              currency={token0}
              onSelect={setToken0}
              customTokenMap={customTokensMap}
              onAddToken={addCustomToken}
              onRemoveToken={removeCustomToken}
              chainId={chainId}
              tokenMap={tokenMap}
            />
            <div className="flex items-center justify-center -mt-[12px] -mb-[12px] z-10">
              <div className="group bg-slate-700 p-0.5 border-2 border-slate-800 transition-all rounded-full">
                <PlusIcon width={16} height={16} />
              </div>
            </div>
            <div className="bg-slate-800">
              <Web3Input.Currency
                className="p-3 !pb-1"
                value={input1}
                onChange={onChangeToken1TypedAmount}
                currency={token1}
                onSelect={setToken1}
                customTokenMap={customTokensMap}
                onAddToken={addCustomToken}
                onRemoveToken={removeCustomToken}
                chainId={chainId}
                tokenMap={tokenMap}
                loading={
                  poolState === PairState.LOADING ||
                  poolState === ConstantProductPoolState.LOADING ||
                  poolState === StablePoolState.LOADING
                }
              />
              <div className="p-3">
                <Checker.Connected fullWidth size="md">
                  <Checker.Network fullWidth size="md" chainId={chainId}>
                    <Checker.Amounts
                      fullWidth
                      size="md"
                      chainId={chainId}
                      fundSource={FundSource.WALLET}
                      amounts={[parsedInput0, parsedInput1]}
                    >
                      {pool && (isConstantProductPool(pool) || isStablePool(pool)) && isBentoBoxV1ChainId(chainId) && (
                        <AddSectionReviewModalTrident
                          poolAddress={pool.liquidityToken.address}
                          // TODO: Shouldnt need to cast if this is done right
                          poolState={poolState as ConstantProductPoolState | StablePoolState}
                          pool={pool as ConstantProductPool | StablePool}
                          chainId={chainId}
                          token0={token0}
                          token1={token1}
                          input0={parsedInput0}
                          input1={parsedInput1}
                        >
                          {({ isWritePending, setOpen }) => (
                            <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                              {isWritePending ? <Dots>Confirm transaction</Dots> : title}
                            </Button>
                          )}
                        </AddSectionReviewModalTrident>
                      )}
                      {((pool && isLegacyPool(pool)) || (!pool && !tridentPoolIfCreate)) &&
                        isUniswapV2Router02ChainId(chainId) && (
                          <AddSectionReviewModalLegacy
                            poolState={poolState as PairState}
                            chainId={chainId}
                            token0={token0}
                            token1={token1}
                            input0={parsedInput0}
                            input1={parsedInput1}
                          >
                            {({ isWritePending, setOpen }) => (
                              <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                                {isWritePending ? <Dots>Confirm transaction</Dots> : title}
                              </Button>
                            )}
                          </AddSectionReviewModalLegacy>
                        )}
                      {!pool && tridentPoolIfCreate && isBentoBoxV1ChainId(chainId) && (
                        <CreateSectionReviewModalTrident
                          chainId={chainId}
                          token0={token0}
                          token1={token1}
                          input0={parsedInput0}
                          input1={parsedInput1}
                          fee={FEE_MAP[fee]}
                          poolType={poolType}
                        >
                          {({ isWritePending, setOpen }) => (
                            <Button fullWidth onClick={() => setOpen(true)} disabled={isWritePending} size="md">
                              {isWritePending ? <Dots>Confirm transaction</Dots> : title}
                            </Button>
                          )}
                        </CreateSectionReviewModalTrident>
                      )}
                    </Checker.Amounts>
                  </Checker.Network>
                </Checker.Connected>
              </div>
            </div>
          </Widget.Content>
        </Widget>
        {pool && data && (
          <PoolPositionProvider pool={data}>
            <PoolPositionStakedProvider pool={data}>
              <Container maxWidth={400} className="mx-auto">
                <AddSectionStake
                  title="4. Stake Liquidity"
                  poolId={`${chainShortName?.[chainId]}:${pool.liquidityToken.address}`}
                />
              </Container>
            </PoolPositionStakedProvider>
          </PoolPositionProvider>
        )}
      </div>

      {pool && data && (
        <PoolPositionProvider pool={data}>
          <PoolPositionStakedProvider pool={data}>
            <div className="order-1 sm:order-3">
              <AppearOnMount>
                <AddSectionMyPosition pool={data} />
              </AppearOnMount>
            </div>
          </PoolPositionStakedProvider>
        </PoolPositionProvider>
      )}
    </>
  )
}

export default Add
