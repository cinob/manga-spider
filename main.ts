import { readFileSync, writeFileSync } from 'fs'
import axios from 'axios'
import iconv from 'iconv-lite'

async function getHTML(url: string) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' })
  const contentUtf8 = iconv.decode(data, 'big5')

  // writeFileSync('list.html', contentUtf8, 'utf8')
  writeFileSync('detail.html', contentUtf8, 'utf8')
}

async function parseListHTML() {
  const data = readFileSync('list.html')

  const regex = /‧<a href=["']?(\/comic\/\d+\.html)["']? target=_blank>(.*?)<\/a>/ig
  const urlList = []

  while (true) {
    const match = regex.exec(data.toString())
    if (match === null)
      break
    urlList.push({
      title: match[2],
      url: `https://www.cartoonmad.com${match[1]}`,
    })
  }

  console.log(urlList)
}

async function parseDetailHTML() {
  const data = readFileSync('detail.html')

  const regex = /(.*)<a class=pages href=["']?(\d+)\.html["']?>(\d+)<\/a>/i

  const res = data.toString().match(regex)

  let list: string[] = []

  if (res && res[2]) {
    const num = res[2].slice(0, res[2].length - 3)
    const page = res[2].slice(res[2].length - 3)
    list = Array.from(Array(Number(page))).map((_, index) => `${num}${(index + 1).toString().padStart(3, '0')}`)
  }
  console.log(list)
}

// getHTML('https://www.cartoonmad.com/comic/765401002021001.html')

// parseListHTML()

parseDetailHTML()
