import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import iconv from 'iconv-lite'

async function downloadImage(imageUrl: string, outputPath: string) {
  try {
    // eslint-disable-next-line no-console
    console.log(`正在下载${imageUrl}`)
    const response = await axios.get(imageUrl, { responseType: 'stream' })
    const writer = createWriteStream(outputPath)

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }
  catch (error) {
    console.error('下载图片时出现错误:', error)
  }
}

async function getHTML(url: string) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' })
  const html = iconv.decode(data, 'big5')

  return html
}

async function parseListHTML(content: string) {
  const regex = /‧<a href=["']?(\/comic\/\d+\.html)["']? target=_blank>(.*?)<\/a>/ig
  const urlList = []

  while (true) {
    const match = regex.exec(content.toString())
    if (match === null)
      break
    urlList.push({
      title: match[2],
      url: `https://www.cartoonmad.com${match[1]}`,
    })
  }

  return urlList
}

async function parseDetailHTML(url: string, id: number) {
  const regex = /(.*)<a class=pages href=["']?(\d+)\.html["']?>(\d+)<\/a>/i

  const res = url.match(regex)

  if (res && res[2]) {
    const chapter = res[2].slice(id.toString().length, id.toString().length + 4).replace(/^0+/, '').padStart(3, '0')
    const page = res[2].slice(res[2].length - 3)
    const directoryPath = join(__dirname, 'books', `${id}/${chapter}`)
    if (!existsSync(directoryPath))
      mkdirSync(directoryPath, { recursive: true })

    const promiseList = Array.from(Array(Number(page))).map((_, index) => {
      const path = `${id}/${chapter}/${(index + 1).toString().padStart(3, '0')}.jpg`
      return !existsSync(join(__dirname, 'books', path)) ? downloadImage(`https://www.cartoonmad.com/5e585/${path}`, join(__dirname, 'books', path)) : true
    })
    return Promise.all(promiseList)
  }

  return true
}

async function init(id: number) {
  const listHTML = await getHTML(`https://www.cartoonmad.com/comic/${id}.html`)
  const list = await parseListHTML(listHTML)
  for await (const iterator of list)
    parseDetailHTML(await getHTML(iterator.url), id)
}

init(4975)
