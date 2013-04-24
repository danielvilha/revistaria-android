function ViewPage(data, path) {

	var self = Ti.UI.createView({
		width : 'auto',
		height : 'auto',
		visible : false
	});

	self.postlayout = false;
	self.canScroll = true;
	self.path = path;

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

		var imgApp = data.imagem_app;
		imgApp = imgApp.split("/");
		imgApp.reverse();
		var img = Ti.UI.createImageView({
			touchEnabled : false,
			// image : path + "/" + data.imagem_app, //TODO: Foi modificado esta parte do aplicativo para dar um split no json.
			image : path + "/" + imgApp[0],
			width : 'auto',
			height : 'auto',
			top : 0
		});

		var swipeDistance = 80;
		var aligner = 'center';
		var lag = false;
		var baseWidth = Ti.App.image.width;
		var baseHeight = Ti.App.image.height;

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

		var page = Ti.UI.createView({
			touchEnabled : false,
			width : baseWidth,
			height : baseHeight,
			top : 0,
			left : 0
		});

		page.add(img);

		//TODO: Modificado os componentes da página
		if (data.componentes.length > 0) {
			for (var i = 0; i < data.componentes.length; i++) {
				page.add(createButtom(data.componentes[i]));
				//TODO: Função para adicionar o Icone na página se existir.
				page.add(addIcon(data.componentes[i]));
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

			py = parseInt(e.y) - offset.y;
			px = parseInt(e.x) - offset.x;

			if (page.height < self.bounds.height) {
				py = (self.bounds.height - page.height) * .5;
			} else {
				if (py > 0) {
					py = 0;
				} else if (py < self.bounds.height - page.height) {
					py = self.bounds.height - page.height;
				}
			}

			if (px > 0) {
				px = 0;
				aligner = 'left';
			} else if (px < self.bounds.width - page.width) {
				px = self.bounds.width - page.width;
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

			scaling = true;

			if (zoom === 1) {
				var newWidth = baseWidth * 2;
				var newHeight = baseHeight * 2;
				zoom = 2;
			} else {
				var newWidth = baseWidth / 2;
				var newHeight = baseHeight / 2;
				zoom = 1;
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
		//----------------------------------------------------------------------------------------------------------------------------------------//
		//                                                                                                                                        //
		//*************************************************************EVENTO BOTÕES**************************************************************//
		//                                                                                                                                        //
		//----------------------------------------------------------------------------------------------------------------------------------------//
		//FUNÇÃO BOTÕES. TODO: Criar os eventos de link, Galeria, Musica e Vídeo.
		var butWidth = parseInt((data.width / baseWidth) * 90) + '%';
		var butHeight = parseInt((data.height / baseHeight) * 90) + '%';
		var butTop = parseInt((data.top / baseHeight) * 90) + '%';
		var butLeft = parseInt((data.left / baseWidth) * 90) + '%';

		function addIcon(data) {
			if (data.usar_icone == true) {
				var view = Ti.UI.createView({
					width : butWidth,
					height : butHeight,
					top : butTop,
					left : butLeft,
					zIndex : 4
				});

				var icon = Ti.UI.createImageView({
					// image : self.path + '/' + data.tipo + '.png', //TODO: Modificado para buscar a imagem do icone no aplicativo mesmo
					image : data.tipo + '.png',
					width : 'auto',
					height : 'auto',
					iconAlingnment : data.posicao_icone
				});

				var iconAlingnment = data.posicao_icone;

				switch(iconAlingnment) {
					case "1":
						//LeftTop
						icon.left = 5;
						icon.top = 5;
						break;
					case "2":
						//LeftCenter
						icon.left = 5;
						break;
					case "3":
						//LeftBotton
						icon.left = 5;
						icon.bottom = 5;
						break;
					case "4":
						//CenterTop
						icon.top = 5;
						break;
					case "5":
						//Center
						icon.top = null;
						icon.left = null;
						icon.bottom = null;
						icon.right = null;
						break;
					case "6":
						//CenterBotton
						icon.bottom = 5;
						break;
					case "7":
						//RightTop
						icon.right = 5;
						icon.top = 5;
						break;
					case "8":
						//RightCenter
						icon.right = 5;
						break;
					case "9":
						//RightBotton
						icon.right = 5;
						icon.bottom = 5;
						break;
				}

				view.add(icon);

				return view;
			} else {
				return null;
			}
		}

		function createButtom(data) {
			var bt = Ti.UI.createButton({
				backgroundColor : '#0fc2ef',
				opacity : 0.0,
				width : butWidth,
				height : butHeight,
				top : butTop,
				left : butLeft,
				zIndex : 9
			});

			bt.addEventListener('click', function(e) {
				var target = data.tipo;
				var value;

				var window = Titanium.UI.createWindow();

				switch(target) {
					//------------------------------------------------------------PHOTO
					case 1:
						//Imagens
						value = data.galeria;

						var galery = [];

						for (var file = 0, cont = value.length; file < cont; file++) {
							var imgGalery = value[file].imagem;
							imgGalery = imgGalery.split("/");
							imgGalery.reverse();
							galery.push(Titanium.UI.createImageView({
								image : self.path + '/' + imgGalery[0],
								zIndex : 9
							}));
						};

						var scrollableView = Titanium.UI.createScrollableView({
							backgroundColor : '#000',
							width : '100%',
							height : '100%',
							views : galery
						});

						window.backgroundColor = "black";

						window.add(scrollableView);
						window.open({
							modal : true
						});
						break;
					//------------------------------------------------------------VIDEO
					case 2:
						//Video
						value = data.arquivo;

						// window.backgroundColor = "black";

						var Video = self.path + '/' + value;
						Video = Video.split("/");
						Video.reverse();

						var file = self.path + '/' + Video[0];

						Ti.Platform.openURL('url://' + file);

						// var options = {
						// // url : self.path + '/' + value,
						// url : self.path + '/' + Video[0],
						// backgroundColor : '#1111',
						// mediaControlStyle : Titanium.Media.VIDEO_CONTROL_DEFAULT // See TIMOB-2802, which may change this property name
						// };
						//
						// var closeButton = Ti.UI.createButton({
						// top : "10dp",
						// height : "35dp",
						// width : "35dp",
						// right : "10dp",
						// zIndex : 9
						// });
						// window.add(closeButton);
						//
						// var activeMovie = Titanium.Media.createVideoPlayer(options);
						// window.add(activeMovie);
						//
						// activeMovie.addEventListener('complete', function() {
						// window.close();
						// });
						//
						// activeMovie.play();
						//
						// closeButton.addEventListener('click', function() {
						// window.close();
						// });
						//
						// window.addEventListener('close', function() {
						// activeMovie.stop();
						// });
						//
						// window.open();
						break;
					//------------------------------------------------------------PAGE
					case 3:
						//Link para outra página
						value = data.alvo;

						self.fireEvent('page:linkPage', {
							target : target,
							value : value
						});
						break;
					//------------------------------------------------------------URL
					case 4:
						//Link Web
						value = data.alvo;

						var webview = Titanium.UI.createWebView({
							target : target,
							url : value
						});
						window.add(webview);
						window.open({
							modal : true
						});
						break;
					//------------------------------------------------------------MUSIC
					case 5:
						//Audio
						value = data.arquivo;

						var viewControl = Ti.UI.createView({
							top : 0,
							height : "50dp",
							width : "100%"
						});

						var Audio = self.path + '/' + value;
						Audio = Audio.split("/");
						Audio.reverse();

						var options = {
							// url : self.path + '/' + value,
							url : self.path + '/' + Audio[0],
							mediaControlStyle : Titanium.Media.VIDEO_CONTROL_DEFAULT
						};

						var activeAudio = Titanium.Media.createVideoPlayer(options);

						viewControl.add(activeAudio);

						var closeButton = Ti.UI.createButton({
							top : "10dp",
							height : "35dp",
							width : "35dp",
							right : "10dp",
							zIndex : 9
						});

						viewControl.add(closeButton);

						activeAudio.play();

						activeAudio.addEventListener('complete', function() {
							activeAudio.stop();
							self.remove(viewControl);
						});

						closeButton.addEventListener('click', function() {
							activeAudio.stop();
							self.remove(viewControl);
						});

						viewControl.addEventListener('hide', function() {
							activeAudio.stop();
							self.remove(viewControl);
						});

						self.add(viewControl);
						break;
					default:
						return null;
				}
			});

			return bt;
		}


		self.fitPage();
		self.visible = true;
	};

	return self;
}

//make constructor function the public component interface
module.exports = ViewPage;
