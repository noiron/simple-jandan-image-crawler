process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var superagent = require('superagent');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var jsonfile = require('jsonfile');

var file = './data.json';

var allItems = {
    pageVisited: [],
    data: []
};

const beginPageNum = 2199;
const endPageNum = 2190;
let pageVisited = [];
jsonfile.readFile(file, function (err, obj) {
    if (err) {
        console.log('nothing here.')
    }
    if (obj) {
        pageVisited = obj.pageVisited;
        allItems = obj;
    }

    fetchPage(beginPageNum);
})

function fetchPage(pageNum) {
    let imageData = {};

    if (pageVisited.indexOf(pageNum) > -1) {
        console.log(`${pageNum}页已经访问过`);
        fetchPage(pageNum - 1);
        return;
    }
    console.log(`正在访问第${pageNum}页`);

    superagent.get(`http://www.jandan.net/ooxx/page-${pageNum}`)
        .set({
            'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36'
        })
        .end(function (err, sres) {
            if (err) {
                console.log(err);
            }

            var $ = cheerio.load(sres.text);

            $('.commentlist li').each(function (index, element) {
                $element = $(element);

                // 评论链接
                const commentLink = $element.find('.text .righttext a').attr('href');
                const commentCode = $element.find('.text .righttext a').text();

                // 贴图者的姓名
                const $author = $($element.find('.author strong'));
                const authorName = $author.text();
                const authorCode = $author.attr('title').slice(4);


                // 图片元素
                const $image = $($element.find('.text p img'));
                const imageSrcArr = [];
                const largeImageSrcArr = [];
                $image.each(function(index, img) {
                    const imgSrc = $(img).attr('src');
                    const imageSplit = imgSrc.split('/');
                    imageSplit[3] = 'large';
                    const largeImageSrc = imageSplit.join('/');

                    imageSrcArr.push(imgSrc);
                    largeImageSrcArr.push(largeImageSrc);
                })

                console.log(pageNum, largeImageSrcArr);

                // oo数和xx数
                const ooNum = $element.find(`#cos_support-${commentCode}`).text();
                const xxNum = $element.find(`#cos_unsupport-${commentCode}`).text();

                imageData = {
                    comment: {
                        page: pageNum,
                        code: commentCode,
                        link: commentLink,
                    },
                    author: {
                        name: authorName,
                        code: authorCode,
                    },
                    image: {
                        src: imageSrcArr,
                        large: largeImageSrcArr
                    },
                    ooxx: {
                        ooNum,
                        xxNum
                    }
                }
                allItems.data.push(imageData);

            })
            allItems.pageVisited.push(pageNum);

            console.log(`${pageNum}页已经读取完毕`);
            console.log('--------------------------------------------------------------');
            
            if (pageNum > endPageNum) {
                pageNum -= 1;
                setTimeout(function () {
                    fetchPage(pageNum)
                }, 5000 + Math.random().toFixed(3) * 2000);
                jsonfile.writeFileSync(file, allItems, { spaces: 4 });
            } else {
                console.log('Finished>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
                jsonfile.writeFileSync(file, allItems, { spaces: 4 });
            }

        })
}