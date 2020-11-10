class Slider {
	constructor(data) {
		this.type = data.type
		this.x = 0
		this.pret = 0
		this.card = 0
		this.amount = 0
		this.urlBase = data.url
		this.imageUrl = data.imageUrl
		this.activeElem = data.activeSlide
		this.wrapperId = data.idCopmlex
		this.wrapper = $(`.js-s3d__wrapper__${this.wrapperId}`)
		this.ctx = document.getElementById(`js-s3d__${this.wrapperId}`).getContext('2d') // Контекст
		this.wrapperEvent = '.js-s3d__svgWrap'
		this.height = 1080
		this.width = 1920
		this.flagMouse = false
		this.currentSlide = data.activeSlide
		this.nextSlide = data.activeSlide
		this.openHouses = [1]

		this.eventsName = {
			start: 'mousedown',
			end: 'mouseup',
			leave: 'mouseleave',
			move: 'mousemove',
		}

		this.svgConfig = data
		this.controlPoint = data.controlPoint
		this.images = []
		this.result = {
			min: data.numberSlide.min,
			max: data.numberSlide.max,
		}
		this.mouseSpeed = data.mouseSpeed
		this.numberSlide = {
			min: data.numberSlide.min,
			max: data.numberSlide.max,
		}
		this.startDegCompass = (360 / this.numberSlide.max)
		this.infoBox = ''
		this.infoBoxActive = false
		this.infoBoxHidden = true
		this.activeSvg = null
		this.activeFloor = null
		this.rotate = true
		this.animates = () => {}

		// this.updateInfo = this.updateInfo.bind(this);
		// this.hiddenInfo = this.hiddenInfo.bind(this);
		this.ActiveHouse = data.ActiveHouse
		this.resize = this.resize.bind(this)
		this.init = this.init.bind(this)
		this.click = data.click
		this.getFlatObj = data.getFlatObj
		this.setActiveSvg = this.setActiveSvg.bind(this)
		// this.mouseEventMove = this.mouseEventMove.bind(this);
		this.activeFlat = data.activeFlat
		this.compass = data.compass
		this.left = this.left.bind(this)
		this.right = this.right.bind(this)
		this.changeNext = this.changeNext.bind(this)
		this.changePrev = this.changePrev.bind(this)
		this.updateActiveFlat = this.updateActiveFlat.bind(this)
		this.loader = data.loader
	}

	init() {
		if (isDevice('ios')) {
			this.mouseSpeed = 0.5
		}
		if (isDevice()) {
			this.eventsName = {
				start: 'touchstart',
				end: 'touchend',
				leave: 'touchcancel',
				move: 'touchmove',
			}
		} else {
			this.wrapper.on(`${this.eventsName.end} ${this.eventsName.leave}`, e => {
				if (e.target.classList.contains('s3d__button') || e.target.classList.contains('s3d-infoBox__link')) return
				this.activeAnimate(false)
				this.amount = 0
				if (this.flagMouse) {
					this.flagMouse = false
					this.infoBoxHidden = false
					this.rewindToPoint.call(this)
					// $(this.activeSvg).css({'fill':''});
				}
			})

			this.wrapper.on(this.eventsName.start, e => {
				if (e.target.classList.contains('s3d__button') || !this.rotate || e.target.classList.contains('s3d-infoBox__link')) return
				// this.hiddenInfo(e)
				this.rotateStart.call(this, e)
				this.activeAnimate(true)
			})

			this.wrapper.on(this.eventsName.move, this.wrapperEvent, e => {
				if (this.flagMouse && this.rotate) {
					if (!this.infoBoxHidden) {
						this.hiddenInfo(e)
						this.infoBoxHidden = true
					}
					this.activeSvg = $(e.target).closest('svg')
					// this.activeSvg[0].style.opacity = 0
					this.activeSvg.css({ opacity: '0' })
					// $(this.activeSvg).css({'fill':'transparent'});

					this.checkMouseMovement.call(this, e)
				} else if (e.target.tagName === 'polygon' && !this.infoBoxActive) {
					// this.getFlatObj(e.target.dataset.id)
					this.updateInfo(this.getFlatObj(+e.target.dataset.id))
				} else if (!this.infoBoxActive) {
					this.hiddenInfo(e)
				}
			})
		}
		this.updateImage()

		this.wrapper.on('click', 'polygon', e => {
			e.preventDefault()
			this.infoBoxActive = true
			// this.ActiveHouse.set(+e.target.dataset.build)
			// if (this.openHouses.includes(+e.target.dataset.build)) {
			// 	let conf = JSON.parse(window.sessionStorage.getItem('chooseFlatDefaults'))
			// 	if (conf !== undefined) {
			// 		conf = {}
			// 		conf.build = $(e.currentTarget).data('build')
			// 	} else {
			// 		conf = {
			// 			build: $(e.currentTarget).data('build'), counter: 12, type: '1', rooms: '1',
			// 		}
			// 	}
			// 	window.sessionStorage.setItem('chooseFlatDefaults', JSON.stringify(conf))
			// 	window.location.href = $(e.currentTarget).attr('href')
			//
			// 	// this._ActiveHouse.set(+e.target.dataset.build);
			// 	// this.updateInfo(e);
			// 	return
			// }
			if (!this.infoBox.hasClass('s3d-infoBox-active')) {
				this.infoBox.addClass('s3d-infoBox-active')
			}
			if (this.infoBox.hasClass('s3d-infoBox-hover')) {
				this.infoBox.removeClass('s3d-infoBox-hover')
			}
			this.infoBox.find('.s3d-infoBox__link')[0].dataset.id = e.target.dataset.id
			// this.updateInfo(e)
			// this.activeFloor = +e.target.dataset.floor;
			$('.js-s3d__svgWrap .active-flat').removeClass('active-flat')
			$(e.target).addClass('active-flat')
			this.activeSvg = $(e.target).closest('svg')

			$(this.activeSvg).css({ opacity: '' })
			this.compass.save(this.compass.current)
			// this.click(e, this.type);
		})

		this.createSvg()
		this.createInfo()
		this.createArrow()
		this.infoBox.on('click', '.js-s3d-infoBox__close', () => {
			this.hiddenInfo()
		})
		this.infoBox.on('click', '.s3d-infoBox__link', event => {
			event.preventDefault()
			console.log(this.activeFlat)
			this.activeFlat.value = event.target.dataset.id
			// this.click(event, this.type)
			this.click(event, 'apart', event.target.dataset.id)
		})
		$('.js-s3d__wrap').scrollLeft($('.js-s3d__wrap').width() / 4)

		// createMarkup('div' , '#js-s3d__wrapper', {
		//   class:'s3d__helper js-s3d__helper',
		//   content: '<img src="/wp-content/themes/idealist/assets/s3d/images/icon/help-arrow.svg" class="s3d-arrow"/><img src="/wp-content/themes/idealist/assets/s3d/images/icon/help-logo.svg" class="s3d__helper-logo"/> <div class="s3d__helper__text">Оберіть </br>будинок</div>'
		// });
	}

	setConfig(data) {
		this.type = data.type || this.type
		this.urlBase = data.url || this.urlBase
		this.imageUrl = data.imageUrl || this.imageUrl
		this.activeElem = data.activeSlide || this.activeElem
		this.wrapperId = data.idCopmlex || this.wrapperId
		this.currentSlide = data.activeSlide || this.currentSlide
		this.nextSlide = data.activeSlide || this.nextSlide
		this.svgConfig = data || this.svgConfig
		this.controlPoint = data.controlPoint || this.controlPoint
		this.mouseSpeed = data.mouseSpeed || this.mouseSpeed
	}

	update(config) {
		this.setConfig(config)
		this.updateImage()
	}

	updateImage() {
		const self = this
		this.ctx.canvas.width = this.width
		this.ctx.canvas.height = this.height
		let index = 1
		for (let i = 0; i <= self.numberSlide.max; i++) {
			const img = new Image()
			img.src = `${self.imageUrl + i}.jpg`
			img.onload = function load() {
				index++
				self.images[i] = this
				if (i === self.activeElem) {
					// let deg = self.startDegCompass * self.activeElem + (self.startDegCompass * 57);
					// $('.s3d-filter__compass svg').css('transform','rotate('+ deg +'deg)');
					self.compass.save(self.activeElem)
					self.ctx.drawImage(this, 0, 0, self.width, self.height)
				}
				if (index === self.numberSlide.max) {
					self.resizeCanvas()
					setTimeout(() => {
						self.loader.hide(self.type, this.wrapper)
					}, 100)
				}
			}
		}
		this.setActiveSvg(this.ActiveHouse.get())
	}

	resizeCanvas() {
		const factorW = this.width / this.height
		const factorH = this.height / this.width
		const canvasWrapp = $('.js-s3d__wrapper__complex')
		const canvas = $('#js-s3d__complex')
		const diffW = this.width / canvasWrapp.width()
		const diffH = this.height / canvasWrapp.height()

		if (diffW < diffH) {
			canvas.width(canvasWrapp.width())
			canvas.height(canvasWrapp.width() * factorH)
		} else {
			canvas.height(canvasWrapp.height())
			canvas.width(canvasWrapp.height() * factorW)
		}
	}

	rotateStart(e) {
		this.cancelAnimateSlide()
		this.x = e.pageX || e.targetTouches[0].pageX
		this.pret = e.pageX || e.targetTouches[0].pageX
		this.flagMouse = true
		this.activeSvg = $(e.target).closest('svg')
		$(this.activeSvg).css({ opacity: '0' })
	}

	resize() {
		this.height = this.wrapper.height()
		this.width = this.wrapper.width()
		this.ctx.canvas.width = this.width
		this.ctx.canvas.height = this.height
		this.ctx.drawImage(this.images[this.activeElem], 0, 0, this.width, this.height)
	}

	createSvg() {
		const svg = new Svg(this.svgConfig)
		svg.init(this.setActiveSvg.bind(this, this.ActiveHouse.get()))
	}

	createArrow() {
		const arrowLeft = createMarkup('button', this.wrapper, { class: 's3d__button s3d__button-left js-s3d__button-left unselectable' })
		$(arrowLeft).append('<svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 9L-1.96701e-07 4.5L7 0L7 3.82025L7 5.17975L7 9Z" fill="#EB8271"/></svg>')
		$('.js-s3d__button-left').on('click', this.left)

		const arrowRight = createMarkup('button', this.wrapper, { class: 's3d__button s3d__button-right js-s3d__button-right unselectable' })
		$(arrowRight).append(`<svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M1.18021e-06 -2.38419e-06L7 4.5L0 9L5.00966e-07 5.17974L6.79242e-07 3.82025L1.18021e-06 -2.38419e-06Z" fill="#EB8271"/>
</svg>`)
		$('.js-s3d__button-right').on('click', this.right)
	}

	setActiveSvg(house) {
		$('.js-s3d__container-active').removeClass('js-s3d__container-active')
		$(`.js-s3d__svg-container${house}`).addClass('js-s3d__container-active')
	}

	updateSvgActive(wrap, current) {
		$(this.activeSvg).css({ opacity: '' })
		const clas = this.type === 'house' ? `.js-s3d__svg-container${this.ActiveHouse.get()} ` : '.js-s3d__svg-container__complex '
		$(`${clas}.s3d__svg__active`).removeClass('s3d__svg__active')
		$(`${clas}.${wrap}__${this[current]}`).addClass('s3d__svg__active')
		this.currentSlide = this[current]
	}

	getNumSvgWithFlat(id) {
		const controlPoint = $(`.js-s3d__svgWrap polygon[data-id=${id}]`).map((i, poly) => +poly.closest('.js-s3d__svgWrap').dataset.id).toArray()

		console.log('getNumSvgWithFlat(id)', controlPoint, id)

		this.cancelAnimateSlide()
		if (!controlPoint.includes(this.activeElem)) {
			controlPoint.forEach(el => {
				if (el < this.activeElem && el > this.result.min) {
					this.result.min = el
				} else if (el > this.activeElem && el < this.result.max) {
					this.result.max = el
				}
			})

			if (this.result.min === 0) {
				this.result.min = controlPoint[controlPoint.length - 1] - this.numberSlide.max
			}

			if (this.result.max === this.numberSlide.max) {
				this.result.max = controlPoint[0] + this.numberSlide.max
			}

			this.checkResult()
		} else {
			this.updateSvgActive(this.type, 'activeElem')
		}
	}

	// createInfo() {
	// 	const infoBox = createMarkup('div', '.js-s3d__slideModule', { class: 'js-s3d-infoBox s3d-infoBox' })
	//
	// 	const infoBoxContent = `<ul>
	//       <li class="js-s3d-infoBox__house s3d-infoBox__house">house: <span>5</span></li>
	//       <!--<li class="js-s3d-infoBox__section">section: <span>7</span>-->
	//       <!--<li class="js-s3d-infoBox__apartments">apartments: <span>10</span></li>-->
	//       <li class="js-s3d-infoBox__floor s3d-infoBox__floor">floor: <span>10</span></li>
	//   </ul>`
	// 	$(infoBox).append(infoBoxContent)
	// 	this.infoBox = $(infoBox)
	// }

	// start info functions ---------------
	createInfo() {
		const infoBox = createMarkup('div', '.js-s3d-controller', { class: 'js-s3d-infoBox s3d-infoBox' })

		const infoBoxContent = `
<!--<ul>-->
<!--				<div class="s3d-infoBox s3d-infoBox-active">-->
                <div class="s3d-infoBox__static">
                  <div class="s3d-infoBox__icon"><img src="assets/s3d/images/icon/house.svg"></div>
                  <div class="s3d-infoBox__text">выберите квартиру на доме</div>
                </div>
                <div class="s3d-infoBox__hover js-s3d-infoBox__hover">
                  <div class="s3d-infoBox__icon"><img src="assets/s3d/images/icon/house.svg"></div>
                  <div class="s3d-infoBox__text js-s3d-infoBox__hover__text">квартира №45</div>
                </div>
                <div class="s3d-infoBox__image">
                  <div class="s3d-infoBox__close js-s3d-infoBox__close"></div>
                  <div class="s3d-infoBox__type js-s3d-infoBox__type">тип 2А</div><img src="assets/s3d/images/KV.png" class="js-s3d-infoBox__image">
                </div>
                <div class="s3d-infoBox__table">
                  <table>
                    <tr>
                      <td class="js-s3d-infoBox__table-number">134</td>
                      <td>№ квартиры</td>
                    </tr>
                    <tr>
                      <td class="js-s3d-infoBox__table-floor">4</td>
                      <td>Этаж</td>
                    </tr>
                    <tr>
                      <td class="js-s3d-infoBox__table-room">2</td>
                      <td>Комнаты</td>
                    </tr>
                    <tr>
                      <td class="js-s3d-infoBox__table-area">56</td>
                      <td>Площадь м2</td>
                    </tr>
                  </table>
                </div>
                <div class="s3d-infoBox__buttons"><button type="button" class="s3d-infoBox__link">Подробнее</button>
                  <button class="s3d-infoBox__add-favourites js-s3d-add__favourites" type="button">
                    <svg>
                      <use xlink:href="#icon-favourites"></use>
                    </svg>
                  </button>
                </div>
<!--              </div>-->


<!--        <li class="js-s3d-infoBox__house s3d-infoBox__house">house: <span>5</span></li>-->
<!--        &lt;!&ndash;<li class="js-s3d-infoBox__section">section: <span>7</span>&ndash;&gt;-->
<!--        &lt;!&ndash;<li class="js-s3d-infoBox__apartments">apartments: <span>10</span></li>&ndash;&gt;-->
<!--        <li class="js-s3d-infoBox__floor s3d-infoBox__floor">floor: <span>10</span></li>-->
<!--    </ul>-->
`
		$(infoBox).append(infoBoxContent)
		this.infoBox = $(infoBox)
	}

	updateInfo(e) {
	// const pos = $('.s3d__wrap').offset()
	// положение курсора внутри элемента
	// const Xinner = e.pageX - pos.left
	// const Yinner = e.pageY - pos.top
	// this.infoBox.css({ opacity: '1' })
	// this.infoBox.css({ top: Yinner - 40 })
	// this.infoBox.css({ left: Xinner })

		if (this.infoBox.hasClass('s3d-infoBox-active')) {
			return
		} else if (!this.infoBox.hasClass('s3d-infoBox-hover')) {
			this.infoBox.addClass('s3d-infoBox-hover')
		}
		// console.log('e.target', this)
		// console.log('this.infoBox', this.infoBox)
		if (this.openHouses.includes(+e.build)) {
			// this.infoBox.data('id', e.id)
			this.infoBox.find('.js-s3d-infoBox__table-number')[0].innerHTML = `${e.build || ''}`
			this.infoBox.find('.js-s3d-infoBox__table-floor')[0].innerHTML = `${e.floor || ''}`
			this.infoBox.find('.js-s3d-infoBox__table-room')[0].innerHTML = `${e.rooms || ''}`
			this.infoBox.find('.js-s3d-infoBox__table-area')[0].innerHTML = `${e['all_room'] || ''}`
			// this.infoBox.find('.js-s3d-infoBox__image')[0].src = `${e['img_big'] || ''}`
			// this.infoBox.find('.js-s3d-infoBox__floor')[0].style.display = ''
		} else {
			this.infoBox.find('.js-s3d-infoBox__house')[0].innerHTML = 'Будинок не у продажу'
			this.infoBox.find('.js-s3d-infoBox__floor')[0].style.display = 'none'
		}
		// this.infoBox.find('.js-s3d-infoBox__house span')[0].innerHTML = e.target.dataset.build || '';
		// this.infoBox.find('.js-s3d-infoBox__section span')[0].innerHTML = e.target.dataset.section || '';
		// this.infoBox.find('.js-s3d-infoBox__floor span')[0].innerHTML = e.target.dataset.floor || '';
	}

	updateInfoFloorList(e) {
		const data = (e.target || e).dataset
		const list = $(`.js-s3d__svgWrap .floor-svg-polygon[data-build=${data.build}][ data-floor=${data.floor}]`)

		list.each((i, el) => {
			this.updateInfoFloor(el, data)
		})

		if (this.openHouses.includes(+data.build)) {
			$(`[data-build=${data.build}] .floor-text`).html(data.floor)
		} else {
			$(`[data-build=${data.build}] .floor-text`).html('будинок не у продажу')
		}
	}

	// updateInfoFlatList(e) {
	// 	const data = (e.target || e).dataset
	// 	const list = $(`.js-s3d__svgWrap polygon[data-id=${data.floor}]`)
	//
	// 	list.each((i, el) => {
	// 		this.updateInfoFlat(el, data)
	// 	})
	//
	// 	if (this.openHouses.includes(+data.build)) {
	// 		$(`[data-build=${data.build}] .floor-text`).html(data.floor)
	// 	} else {
	// 		$(`[data-build=${data.build}] .floor-text`).html('будинок не у продажу')
	// 	}
	// }

	updateInfoFloor(e, data) {
		// положение курсора внутри элемента
		const parent = $(e).closest('svg')
		const widthSvgPhoto = parent.attr('viewBox').split(' ')[2]
		const bbox = e.getBBox()
		const height = (widthSvgPhoto / 13) * 0.2
		const y = (bbox.y + (bbox.height / 2))
		$(parent).find(`.floor-info-svg[data-build=${data.build}]`).addClass('active-floor-info').attr('y', y - (height / 2))

		// if(this.openHouses.includes(+data.build)){
		//     $('[data-build='+ data.build +'] .floor-text').html(data.floor);
		// } else {
		//     $('[data-build='+ data.build +'] .floor-text').html('будинок не у продажу');
		// }
	}

	// updateInfoFlat(e, data) {
	// 	// положение курсора внутри элемента
	// 	const parent = $(e).closest('svg')
	// 	const widthSvgPhoto = parent.attr('viewBox').split(' ')[2]
	// 	const bbox = e.getBBox()
	// 	const height = (widthSvgPhoto / 13) * 0.2
	// 	const y = (bbox.y + (bbox.height / 2))
	// 	$(parent).find(`.flat-info-svg[data-build=${data.build}]`).addClass('active-flat-info').attr('y', y - (height / 2))
	//
	// 	// if(this.openHouses.includes(+data.build)){
	// 	//     $('[data-build='+ data.build +'] .floor-text').html(data.floor);
	// 	// } else {
	// 	//     $('[data-build='+ data.build +'] .floor-text').html('будинок не у продажу');
	// 	// }
	// }

	updateActiveFloor(floor) {
		this.activeFloor = floor
		const nextFloorSvg = $(`.s3d__svg__active [data-build=${this.ActiveHouse.get()}][data-floor=${this.activeFloor}]`)[0]
		this.updateInfoFloorList(nextFloorSvg)
		$('.js-s3d__svgWrap .active-floor').removeClass('active-floor')
		$(`.js-s3d__svgWrap [data-build=${this.ActiveHouse.get()}][data-floor=${this.activeFloor}]`).addClass('active-floor')
	}

	updateActiveFlat(flat) {
		this.activeFlat.value = flat
		const nextFlatSvg = $(`.s3d__svg__active [data-id=${this.activeFlat.value}]`)[0]
		// this.updateInfoFlatList(nextFlatSvg)
		$('.js-s3d__svgWrap .active-flat').removeClass('active-flat')
		$(`.js-s3d__svgWrap [data-id=${this.activeFlat.value}]`).addClass('active-flat')
	}

	hiddenInfo() {
		this.infoBoxActive = false
		this.infoBox.removeClass('s3d-infoBox-active')
		this.infoBox.removeClass('s3d-infoBox-hover')
		// this.infoBox.css({ opacity: '0' })
		// this.infoBox.css({ top: '-10000px' })
		// this.infoBox.css({ left: '-10000px' })
	}

	hiddenInfoFloor() {
		// $('.active-floor-info').removeClass("active-floor-info");
	}

	showInfoFloor() {
		// $('.active-floor-info').addClass("active-floor-info");
		// this.infoBoxFloor.css({'opacity' : '1', 'z-index': ''});
	}
	// end info functions ---------------

	// start block  change slide functions
	toSlideNum(id) {
		this.getNumSvgWithFlat(id)
		this.updateActiveFlat(id)
	}

	repeatChangeSlide(fn) {
		return setInterval(() => {
			fn()
			if (this.activeElem === this.nextSlide) {
				this.cancelAnimateSlide()
				this.updateSvgActive(this.type, 'nextSlide')
				this.activeSvg.css({ opacity: '' })
			}
		}, 30)
	}

	checkResult() {
		if (((this.result.max - this.result.min) / 2) + this.result.min <= this.activeElem) {
			this.nextSlide = this.controlPoint[0]
			if (this.result.max <= this.numberSlide.max) {
				this.nextSlide = this.result.max
			}
			this.repeat = this.repeatChangeSlide(this.changeNext.bind(this))
		} else {
			if (this.result.min > this.numberSlide.min) {
				this.nextSlide = this.result.min
			} else {
				this.nextSlide = this.controlPoint[this.controlPoint.length - 1]
			}
			this.repeat = this.repeatChangeSlide(this.changePrev.bind(this))
		}
	}

	cancelAnimateSlide() {
		clearInterval(this.repeat)
		this.repeat = undefined
		this.result.min = this.numberSlide.min
		this.result.max = this.numberSlide.max
	}

	changeNext() {
		if (this.activeElem === this.numberSlide.max) {
			this.result.max = this.controlPoint[0]
			this.result.min = -1
			this.activeElem = this.numberSlide.min
		} else {
			this.activeElem++
		}
		this.compass.set(this.activeElem)
		this.ctx.drawImage(this.images[this.activeElem], 0, 0, this.width, this.height)
	}

	changePrev() {
		if (this.activeElem === this.numberSlide.min) {
			this.result.max = this.numberSlide.max + 1
			this.result.min = this.controlPoint[this.controlPoint.length - 1]
			this.activeElem = this.numberSlide.max
		} else {
			this.activeElem--
		}

		this.compass.set(this.activeElem)
		this.ctx.drawImage(this.images[this.activeElem], 0, 0, this.width, this.height)
	}

	checkMouseMovement(e) {
		// get amount slide from a touch event
		this.x = e.pageX || e.targetTouches[0].pageX
		this.amount += +((this.x - this.pret) / (window.innerWidth / this.numberSlide.max / this.mouseSpeed)).toFixed(0)
	}

	rewindToPoint() {
		this.cancelAnimateSlide()
		if (!this.controlPoint.includes(this.activeElem)) {
			this.controlPoint.forEach(el => {
				if (el < this.activeElem && el > this.result.min) {
					this.result.min = el
				} else if (el > this.activeElem && el < this.result.max) {
					this.result.max = el
				}
			})

			if (this.result.min === 0) {
				this.result.min = this.controlPoint[this.controlPoint.length - 1] - this.numberSlide.max
			}

			if (this.result.max === this.numberSlide.max) {
				this.result.max = this.controlPoint[0] + this.numberSlide.max
			}

			this.checkResult()
		} else {
			this.updateSvgActive(this.type, 'activeElem')
		}
	}

	right() {
		if (this.rotate) {
			this.rotate = false
			let amount = 0
			this.controlPoint.forEach((el, i) => {
				if (this.activeElem === el) {
					if (i === 0) {
						amount = (this.numberSlide.max - this.controlPoint[this.controlPoint.length - 1]) + (this.controlPoint[0] - this.numberSlide.min)
					} else {
						amount = this.controlPoint[i] - this.controlPoint[i - 1] - 1
					}
				}
			})
			this.changeSlide(amount, this.changePrev)
		}
	}

	left() {
		if (this.rotate) {
			this.rotate = false
			let amount = 0
			this.controlPoint.forEach((el, i) => {
				if (this.activeElem === el) {
					if (i === this.controlPoint.length - 1) {
						amount = (this.numberSlide.max - this.controlPoint[i]) + (this.controlPoint[0] - this.numberSlide.min)
					} else {
						amount = this.controlPoint[i + 1] - this.controlPoint[i] - 1
					}
				}
			})
			this.changeSlide(amount, this.changeNext)
		}
	}

	changeSlide(amount, fn) {
		let index = 0
		$('.s3d__svg-container').css({ opacity: 0 })
		const timeout = setInterval(() => {
			fn()
			if (index >= amount) {
				clearInterval(timeout)
				this.updateSvgActive(this.type, 'activeElem')
				$(this.activeSvg).css({ opacity: '' })
				// $(this.activeSvg).css({'fill':''});
				$('.s3d__svg-container').css({ opacity: 1 })
				this.rotate = true
				return
			}

			index++
		}, 30)
	}

	activeAnimate(flag) {
		if (flag) {
			this.animates = this.animate()
		} else {
			window.cancelAnimationFrame(this.animates)
		}
	}

	animate() {
		if (this.amount >= 1) {
			this.changeNext()
			this.amount -= 1
			// this.changeSlide(this.amount,this.changePrev);
			this.pret = this.x
			// this.amount = 0;
		} else if (this.amount <= -1) {
			this.changePrev()
			this.amount += 1
			// this.changeSlide(this.amount*-1,this.changeNext);
			this.pret = this.x
			// this.amount = 0;
		}
		this.animates = requestAnimationFrame(this.animate.bind(this))
	}

	// end block  change slide functions
}