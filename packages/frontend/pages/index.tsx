import React, { useCallback, useEffect, useState } from 'react'
import Meet from '../artifacts/contracts/Meet.sol/MeetSH.json'
// import Multi from '../artifacts/contracts/Multicall.sol/Multicall.json'
import { Box, Button } from '@chakra-ui/react'
import { Map, Marker, Markers, PluginConfig, PluginList } from 'react-amap'
import { useContract, useProvider, useSigner } from 'wagmi'

import Layout from '../components/layout/Layout'
import InfoCard from '../components/Info'

const mapPlugins: Array<PluginList | PluginConfig> = ['ToolBar', 'Scale']

// const RINKEY_CONTRACT_ADDRESS = '0x45b571aF38e5650E74eC7D55E604D945FEdE5FCD'
const GOERLI_CONTRACT_ADDRESS = '0x1145c547CbFfE2D24cCfA0fE10938232062bc036';

// [["0x8af8c26D62954B5CA17B7EEA5231b0F9893aDD9f", "shoping", "https://baike.baidu.com/pic/.shop/19680211/1/0b46f21fbe096b63d50577bf0b338744eaf8acc4?fr=lemma&ct=single", 1, [114122, 22627], 1000000000000],["0x8af8c26D62954B5CA17B7EEA5231b0F9893aDD9f", "meeting", "https://pica.zhimg.com/v2-4cc4eab1aafec727cccc8a573fa4a869_1440w.jpg?source=172ae18b", 4, [114127, 22624], 2000000000000],["0x8af8c26D62954B5CA17B7EEA5231b0F9893aDD9f", "grass", "https://gd-hbimg.huaban.com/f35fa8035787f65662fe63a6819b1ca9bfb3bbf03930c7-nGwM3w_fw658/format/webp", 8, [114129, 22619], 3000000000000]]

enum LandType {
  WORK,
  SHOPING,
  PARK,
  ROAD,
  MEETING,
  SPORT,
  OTHER,
  PLAIN,
  GRASS,
  WATER,
  FOREST,
  MOUNTAIN,
  DESERT,
}

type Position = {
  lng: number
  lat: number
}

type Land = {
  host: string
  name: string // name or store
  url: string // your avatar or link
  typ: LandType
  pos: Position
  price: number
}

function HomeIndex(): JSX.Element {
  const styleC = {
    background: `url('http://icons.iconarchive.com/icons/paomedia/small-n-flat/1024/map-marker-icon.png')`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    width: '30px',
    height: '40px',
    color: '#000',
    textAlign: 'center',
    lineHeight: '40px',
  } as const

  const { data: signer } = useSigner()
  const provider = useProvider()
  const meetContract = useContract({
    addressOrName: GOERLI_CONTRACT_ADDRESS,
    contractInterface: Meet.abi,
    signerOrProvider: signer ?? provider,
  })

  // const multiContract = useContract({
  //   addressOrName: RINKEY_MULTICALL_ADDRESS,
  //   contractInterface: Multi.abi,
  //   signerOrProvider: signer,
  // })

  const [selected, setSelected] = useState(-1)
  const [pos, setPos] = useState({ lng: 0, lat: 0 })
  const [lands, setLands] = useState<Land[]>([])
  const [makers, setMakers] = useState([])
  const [st, setSt] = useState<number>(0)
  const [has, setHas] = useState(false)
  const [guests, setGuests] = useState(0)


  // { lng: 114.120, lat: 22.625 }
  // { lng: 114.125, lat: 22.625 }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          // setPos({ lng: p.coords.longitude, lat: p.coords.latitude })
          setPos({ lng: 114.120, lat: 22.625 })
          //setPos({ lng: 114.125, lat: 22.625 })
        },
        () => {
          // alert('获取定位失败！')
        }
      )
    }
  }, [])

  const getLands = useCallback(
    async (start: number, end: number) => {
      const lands = []
      const markers = []
      for (let i = start; i < end; i++) {
        const land: Land = await meetContract.allLands(i)
        lands.push(land)
        markers.push({key: i, index: i-start, position: { longitude: land.pos.lng / 1000, latitude: land.pos.lat / 1000 }})
      }
      setSt(start.toNumber())
      setLands(lands)
      setMakers(markers)
    },
    [meetContract]
  )

  const hasLand = useCallback(
    async () => {
      const longitude = Math.round(pos.lng * 1000)
      const latitude = Math.round(pos.lat * 1000)
      const has: boolean = await meetContract.hasLand([longitude, latitude])
      console.log(pos, has)
      setHas(has)
    },
    [meetContract]
  )

  const landGuests = useCallback(
    async (index: number) => {
      const count: number = await meetContract.landGuestCount(index)
      console.log("landGuests", index, count)
      setGuests(count.toNumber())
    },
    [meetContract]
  )

  useEffect(() => {
    if (!meetContract || !provider || !signer) {
      return
    }

    (async () => {
      try {
        const start = await meetContract.landStart()
        const end = await meetContract.landEnd()
        console.log(start, end)
        // 获取所有地块
        getLands(start, end)
        hasLand(Math.round(pos.lng * 1000), Math.round(pos.lat * 1000))
      } catch (error) {
        console.log('🚀 ~ file: index.tsx ~ line 87 ~ ; ~ error', error)
      }
    })()
  }, [getLands, meetContract, provider, signer])

  // 用户点亮地块，参数是经纬度
  function lightLand() {
    try {
      // For some reason we use inverse latitude and longitude here
      const longitude = Math.round(pos.lng * 1000)
      const latitude = Math.round(pos.lat * 1000)

      meetContract.lightLand([longitude, latitude])
    } catch (e) {
      console.log(e)
    }
  }

  function toggleSelected(index: number) {
      // console.log(index, st.toNumber())
      landGuests(index + st);
      if (selected == index) {
        setSelected(-1);
      } else {
        setSelected(index)
      } 
      
  }

  const markerEvent = {
    click: (e, marker) => {
      toggleSelected(marker.getExtData().index)
    }
  }


  return (
    <Layout>
      <Box width="100vw" height="100vh" position="relative">
        <Box position="absolute" left="0" right="0" top="0" bottom="0">
            { 
              selected >= 0 &&
              InfoCard(lands[selected], guests)
            }
          <Map
            amapkey={'788e08def03f95c670944fe2c78fa76f'}
            center={pos}
            zoom={15}
            plugins={mapPlugins}
          >

            {/* 地块显示, onclick如果成功显示卡片 */}
            {
              <Markers
                markers={makers}
                events={markerEvent}
                useCluster
              ></Markers>
            }
            {
              // 查看地图可设置 114.129 22.619, onclick 可打卡 lightLand
            }
            <Marker position={{ latitude: pos.lat, longitude: pos.lng }}>
              <div style={styleC} onClick={lightLand} >
              </div>
              
            </Marker>
          </Map>
        </Box>
      </Box>
    </Layout>
  )
}

export default HomeIndex
