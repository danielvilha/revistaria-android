function ViewPage(data, path) {

	var self = Ti.UI.createView({
		width : 'auto',
		height : 'auto',
		visible : false
	});

	self.postlayout = false;
	self.canScroll = true;

	self.addEventListener('postlayout', function(e) {

		if (!self.postlayout) {
			self.bounds = self.rect;
			self.postlayout = true;

			self.init();
		}
	});

	self.init = function() {
		var px = 0;
		var py = 0;
		var offset = {
			x : 0,
			y : 0
		};
		var swipe = {
			init : 0,
			end : 0
		};
		var swipeDistance = 100;
		var aligner = 'center';
		var lag = false;
		var baseWidth = data.pageWidth;
		var baseHeight = data.pageHeight;
		var minPageWidth = baseWidth;
		var minPageHeight = baseHeight;
		var maxPageWidth = baseWidth;
		var maxPageHeight = baseHeight;
		var pageAR = baseWidth / baseHeight;
		var viewAR = self.bounds.width / self.bounds.height;
		var scaling = false;
		var draging = false;
		var pageRect = {
			width : baseWidth,
			height : baseHeight,
			top : 0,
			left : 0
		};
		var acceleration = .5;
		var loopInterval = 50;

		var page = Ti.UI.createImageView({
			touchEnabled : false,
			width : baseWidth,
			height : baseHeight,
			top : 0,
			left : 0,
			image : path + "/" + data.src,
		});

		var dataLength = data.links.length;
		if (dataLength > 0) {
			for (var i = 0; i < dataLength; i++) {
				page.add(createButtom(data.links[i]));
			}
		}

		self.add(page);

		self.addEventListener('singletap', function(e) {
			if (e.source != self)
				return;
			draging = scaling = false;
			self.fireEvent('page:singletap', {
				x : e.x,
				y : e.y
			});
		});

		self.addEventListener('touchstart', function(e) {
			if (e.source == page) {
				offset.x = e.x;
				offset.y = e.y;
			} else if (e.source == self) {
				viewAR = self.bounds.width / self.bounds.height;
				swipe.end = e.x;
				baseWidth = page.width;
				baseHeight = page.height;
				if (viewAR < pageAR) {
					minPageWidth = self.bounds.width;
					minPageHeight = minPageWidth / pageAR;
				} else {
					minPageHeight = self.bounds.height;
				}
			}
		});

		self.addEventListener('touchend', function(e) {
			draging = scaling = false;
		});

		self.addEventListener('touchmove', function(e) {
			if (scaling)
				return;
			if (e.source != self)
				return;
			draging = true;

			py = parseInt(e.y) - offset.y//parseInt(e.y);
			px = parseInt(e.x) - offset.x//parseInt(e.x);

			if (page.height < self.bounds.height) {
				py = (self.bounds.height - page.height) * .5;
			} else {
				if (py > 0) {
					py = 0;
				} else if (py < self.bounds.height - page.height) {
					py = self.bounds.height - page.height;
				}
			}
			//ATÉ AQUI É A MESMA COISA-------------------------------------------------------------------MUDA ABAIXO
			if (page.width < self.bounds.width) {
				px = (self.bounds.width - page.width) * .5;
			} else {
				if (px > 0) {
					px = 0;
				} else if (px < self.bounds.width - page.width) {
					px = self.bounds.width - page.width;
				}
			}

			if (px >= 0) {
				aligner = 'left';
			} else if (px <= self.bounds.width - page.width) {
				aligner = 'right';
			} else {
				aligner = 'center';
			}

			pageRect.top = py;
			pageRect.left = px;

			swipe.init = parseInt(e.x);

			var swipeRange = swipe.init - swipe.end

			if (swipeRange < -swipeDistance) {
				if (aligner == 'right' && !lag) {
					self.fireEvent('page:swipe', {
						direction : 'right'
					});
					lag = true;
					setTimeout(function() {
						lag = false;
					}, 1000);
				}
			} else if (swipeRange > swipeDistance) {
				if (aligner == 'left' && !lag) {
					self.fireEvent('page:swipe', {
						direction : 'left'
					});
					lag = true;
					setTimeout(function() {
						lag = false;
					}, 1000);
				}
			}

			swipe.end = swipe.init;
		});

		//----------------------------------------------------------------------------------------------------------------------------------------//
		//                                                                                                                                        //
		//*************************************************************EVENTOS ZOOM***************************************************************//
		//                                                                                                                                        //
		//----------------------------------------------------------------------------------------------------------------------------------------//
		self.addEventListener('pinch', function(e) {
			if (e.source != self)
				return;

			scaling = true;

			var newWidth = baseWidth * e.scale;
			var newHeight = baseHeight * e.scale;

			self.setSize(newWidth, newHeight);
		});

		var zoom = 1;
		self.addEventListener('doubletap', function(e) {
			if (e.source != self)
				return;

			var media = (parseInt(maxPageWidth) + parseInt(minPageWidth)) * .5;
			var newWidth = 0;
			var newHeight = 0;

			// if (zoom === 1) {
			if (pageRect.width < media) {
				newWidth = maxPageWidth;
				newHeight = maxPageHeight;
				// newWidth = baseWidth * 2;
				// newHeight = baseHeight * 2;
				// zoom = 2;
			} else {
				newWidth = minPageWidth;
				newHeight = minPageHeight;
				// newWidth = baseWidth / 2;
				// newHeight = baseHeight / 2;
				// zoom = 1;
			}
			self.setSize(newWidth, newHeight);
		});
		//FIM BLOCO-------------------------------------------------------------------------------------------------------------------------------
		//ajusta a imagem no inicio
		self.fitPage = function() {
			if (viewAR < pageAR) {
				minPageWidth = self.bounds.width;
				minPageHeight = minPageWidth / pageAR;

				page.top = (self.bounds.height - minPageHeight) * .5;
				pageRect.top = page.top;
				page.left = 0;
				pageRect.left = 0;
			} else {
				minPageHeight = self.bounds.height;
				minPageWidth = minPageHeight * pageAR;

				page.left = (self.bounds.width - minPageWidth) * .5;
				pageRect.left = page.left;
				page.top = 0;
				pageRect.top = 0;
			}

			page.width = minPageWidth;
			page.height = minPageHeight;
			pageRect.width = minPageWidth;
			pageRect.height = minPageHeight;

			self.canScroll = true;
		}
		//FUNÇÃO PARA O TAMANHO DA IMAGEM TODO: Modificar esta função e suas propriedades (doubletap)
		self.setSize = function(newWidth, newHeight) {
			if (viewAR < pageAR) {
				if (newWidth <= minPageWidth) {
					newWidth = minPageWidth;
					newHeight = minPageHeight;
					self.canScroll = true;
					self.fireEvent('page:canScroll', {
						scroll : true
					});
				} else {
					self.canScroll = false;
					self.fireEvent('page:canScroll', {
						scroll : false
					});
				}
			} else {
				if (newHeight <= minPageHeight) {
					newWidth = minPageWidth;
					newHeight = minPageHeight;
					self.canScroll = true;
					self.fireEvent('page:canScroll', {
						scroll : true
					});
				} else {
					self.canScroll = false;
					self.fireEvent('page:canScroll', {
						scroll : false
					});
				}
			}

			if (newWidth > maxPageWidth)
				newWidth = maxPageWidth;
			if (newHeight > maxPageHeight)
				newHeight = maxPageHeight;

			if (newWidth < self.bounds.width) {
				pageRect.left = (self.bounds.width - newWidth) * .5;
			} else {
				if (newWidth <= self.bounds.width - page.left) {
					pageRect.left = self.bounds.width - newWidth;
				} else {
					pageRect.left = (self.bounds.width - newWidth) * (offset.x / self.bounds.width);
				}
			}

			if (newHeight < self.bounds.height) {
				pageRect.top = (self.bounds.height - newHeight) * .5;
			} else {
				if (newHeight <= self.bounds.height - page.top) {
					pageRect.top = self.bounds.height - newHeight;
				} else {
					pageRect.top = (self.bounds.height - newHeight) * (offset.y / self.bounds.height);
				}
			}

			pageRect.width = newWidth;
			pageRect.height = newHeight;
		}

		self.update = function() {
			page.width += (pageRect.width - page.width) * acceleration;
			page.height += (pageRect.height - page.height) * acceleration;
			page.top += (pageRect.top - page.top) * acceleration;
			page.left += (pageRect.left - page.left) * acceleration;
		}
		self.fitPage();
		self.visible = true;
	};

	//----------------------------------------------------------------------------------------------------------------------------------------//
	//                                                                                                                                        //
	//*************************************************************EVENTO BOTÕES**************************************************************//
	//                                                                                                                                        //
	//----------------------------------------------------------------------------------------------------------------------------------------//
	//FUNÇÃO BOTÕES. TODO: Criar os eventos de link, Galeria, Musica e Vídeo.
	function createButtom(data) {
		var bt = Ti.UI.createButton({
			backgroundColor : '#333',
			width : data.width,
			height : data.height,
			top : data.top,
			left : data.left
		});

		bt.addEventListener('click', function(e) {
			var target = data.target;
			var value = data.value;

			switch(target) {
				case "page":
					Ti.App.fireEvent('page:linkPage', {
						target : target,
						value : value
					});
					break;
				case "url":
					var webview = Titanium.UI.createWebView({
						target : target,
						url : value
					});
					var window = Titanium.UI.createWindow();
					window.add(webview);
					window.open({
						modal : true
					});
					break;
				case "photo":
					var galery = [];

					for (var file = 0, cont = value.length; file < cont; file++) {
						galery.push(Titanium.UI.createImageView({
							target : target,
							image : '../revistas/ed_001/galery/' + value[file]
						}));
					};

					var scrollableView = Titanium.UI.createScrollableView({
						backgroundColor : '#000',
						width : '100%',
						height : '100%',
						views : galery
					});
					var window = Titanium.UI.createWindow();
					window.add(scrollableView);
					window.open({
						modal : true
					});
					break;
				case "video":
					var activeMovie = Titanium.Media.createVideoPlayer({
						url : value,
						backgroundColor : 'black',
						movieControlMode : Titanium.Media.VIDEO_CONTROL_DEFAULT,
						scalingMode : Titanium.Media.VIDEO_SCALING_ASPECT_FILL,
						fullscreen : true,
						autoplay : true
					});

					var closeButton = Ti.UI.createButton({
						title : "Fechar",
						top : "0dp",
						height : "40dp",
						left : "10dp",
						right : "10dp"
					});

					closeButton.addEventListener('click', function() {
						activeMovie.hide();
						activeMovie.release();
						activeMovie = null;
					});

					activeMovie.add(closeButton);

					window.add(activeMovie);
					window.open({
						modal : true
					});
					break;
				case "music":
					var audioPlayer = Ti.Media.createAudioPlayer({
						url : value,
						allowBackground : true
					});

					audioPlayer.start();
					break;
				default:
					alert(value);
			}
		});

		return bt;
	}

	return self;
}

//make constructor function the public component interface
module.exports = ViewPage;