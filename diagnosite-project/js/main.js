var miaov = {};

miaov.timeScroll = null;  // 挂载整屏动画切换的实例

miaov.currentStep = 'step1';

miaov.init = function(){

	// 设置每一屏的高度和top值
	miaov.resize();

	// 配置事件
	miaov.events();

	// 配置导航条的动画
	miaov.configIntAnimate();

	// 3D翻转
	miaov.button3D('.start','.state1','.state2',.3);

	// 配置整屏切换动画以及每一屏下的动画
	miaov.configTimescroll();

}


$(document).ready( miaov.init );


// 配置事件:浏览器事件，鼠标事件，键盘事件
miaov.events = function(){
	$(window).resize(miaov.resize);

	miaov.nav(); // 执行导航条的鼠标移入移出的动画


	// 使滚动条归零,解决浏览器记录上次滚动条位置的问题
	/*
	
	通过给滚动事件绑定回调函数，在回调函数里实现滚动条归零是可行的，因为如果直接用类似document.documentElement.scrollTop = 0的方式
	给滚动条归零可能还是不行，
	因为浏览器还是会记住上一次的位置，但用onscroll就可以，因为页面一打开浏览器会调用这个方法

	 */
	$(window).bind('scroll',scrollFn);
	function scrollFn(){
		$(window).scrollTop(0);
	}


	$(window).bind("mousedown",function(){
		$(window).unbind("scroll",scrollFn);
	});

	// 当mouseup的时候，让当前这一屏到达某个状态
	$(window).bind('mouseup',miaov.mouseupFn);
	


	/*********************************************************/
	// 干掉浏览器默认的滚动行为
	$('.wrapper').bind('mousewheel',function(e){
		e.preventDefault();
	});

	// 手动设置滚动条
	$('.wrapper').one('mousewheel',mousewheelFn);
	var timer = null;

	// 可能jQ-mousewhell.js封装的mousewheel事件回调函数的第二个参数就是滚动状态
	function mousewheelFn(e,direction){
		// 解绑滚动条归零函数，避免错误
		$(window).unbind('scroll',scrollFn);
		if( direction < 1 ){ //向下滚动
			// console.log('next');
			miaov.changeStep('next');
		}else{	//向上滚动
			// console.log('up');
			miaov.changeStep('pre');
		}

		clearTimeout(timer);	
		timer = setTimeout(function(){
			$('.wrapper').one('mousewheel',mousewheelFn);
		},1200);

	}
	/*********************************************************/

	// 在滚动条滚动的过程中，计算页面中应该到哪一个时间点上去
	$(window).bind('scroll',miaov.scrollStatus);


};



// 当mouseup的时候，让当前这一屏到达某个状态
miaov.mouseupFn = function(){

	// 在滚动过程中计算一个比例
	var scale = miaov.scale();

	// 得到当前页面到达的某个时间点
	var times = scale * miaov.timeScroll.totalDuration();

	// 获取到上一个状态和下一个状态
	var prevStep = miaov.timeScroll.getLabelBefore(times);
	var nextStep = miaov.timeScroll.getLabelAfter(times);

	// 获取到上一个状态的时间和下一个状态的时间
	var prevTime = miaov.timeScroll.getLabelTime(prevStep);
	var nextTime = miaov.timeScroll.getLabelTime(nextStep);

	// 计算差值
	var prevDvalue = Math.abs( prevTime - times );
	var nextDvalue = Math.abs( nextTime - times );

	/*
		如果scale为0
			step1
		如果scale为1
			step5
		如果 prevDvalue < nextDvalue
			prevDvalue
		如果 prevDvalue > nextDvalue
			nextDvalue
	 */
	
	var step = '';
	if( scale === 0 ){
		step = 'step1';
	}else if( scale === 1 ){
		step = 'step5';
	}else if( prevDvalue < nextDvalue ){
		step = prevStep;
	}else{
		step = nextStep;
	}

	miaov.timeScroll.tweenTo(step);


	/*******************当松开鼠标控制滚动条到达某个状态计算出来的位置***************************/


	// 获取动画的总时长
	var totalTime = miaov.timeScroll.totalDuration();

	// 获取要到达的状态的时间
	var afterTime = miaov.timeScroll.getLabelTime(step);

	// 获取到滚动条能够滚动的最大高度
	var maxH = $('body').height() - $(window).height();

	// 计算出滚动条滚动的距离
	var positionY = afterTime/totalTime * maxH;

	// 滚动条滚动的距离的持续时间
	var d = Math.abs( miaov.timeScroll.time() - afterTime );

	// 设置滚动条动画
	var scrollAnimate = new TimelineMax();
	scrollAnimate.to('html,body',d,{'scrollTop':positionY});

	// 更新总的状态字符串
	miaov.currentStep = step;


	/********************************************************************************/



}



// 计算滚动条在滚动过程中的一个比例
miaov.scale = function(){
	var scrollT = $(window).scrollTop();
	var MaxH = $('body').height() - $(window).height();
	var s = scrollT / MaxH;
	return s;
}

// 在滚动条滚动的过程中，计算页面中应该到哪一个时间点上去
miaov.scrollStatus = function(){

	var times = miaov.scale() * miaov.timeScroll.totalDuration();
	miaov.timeScroll.seek(times,false); // 加false执行每个动画的回调函数

}



// 切换整屏并且计算滚动条的距离
miaov.changeStep = function(value){
	if( value === 'next' ){ // 向下

		// 获取当前的时间
		var currentTime = miaov.timeScroll.getLabelTime(miaov.currentStep);

		// 获取到下一个状态的字符串
		var afterStep = miaov.timeScroll.getLabelAfter(currentTime);

		if( !afterStep ) return;

		// 获取动画的总时长
		var totalTime = miaov.timeScroll.totalDuration();

		// 获取下一个状态的时间
		var afterTime = miaov.timeScroll.getLabelTime(afterStep);

		// 获取到滚动条能够滚动的最大高度
		var maxH = $('body').height() - $(window).height();

		// 计算出滚动条滚动的距离
		var positionY = afterTime/totalTime * maxH;

		// 滚动条滚动的距离的持续时间
		var d = Math.abs( miaov.timeScroll.time() - afterTime );

		// 设置滚动条动画
		var scrollAnimate = new TimelineMax();
		scrollAnimate.to('html,body',d,{'scrollTop':positionY});

		// 运动到下一个状态
		miaov.timeScroll.tweenTo(afterStep);

		// 更新状态字符串
		miaov.currentStep = afterStep;

	}else{ // 向上

		// 获取当前的时间
		var currentTime = miaov.timeScroll.getLabelTime(miaov.currentStep);

		// 获取到上一个状态的字符串
		var beforeStep = miaov.timeScroll.getLabelBefore(currentTime);
		
		if( !beforeStep ) return;

		// 获取动画的总时长
		var totalTime = miaov.timeScroll.totalDuration();

		// 获取上一个状态的时间
		var beforeTime = miaov.timeScroll.getLabelTime(beforeStep);

		// 获取到滚动条能够滚动的最大高度
		var maxH = $('body').height() - $(window).height();

		// 计算出滚动条滚动的距离
		var positionY = beforeTime/totalTime * maxH;

		// 滚动条滚动的距离的持续时间
		var d = Math.abs( miaov.timeScroll.time() - beforeTime );

		// 设置滚动条动画
		var scrollAnimate = new TimelineMax();
		scrollAnimate.to('html,body',d,{'scrollTop':positionY});



		// 运动到上一个状态
		miaov.timeScroll.tweenTo(beforeStep);

		// 更新状态字符串
		miaov.currentStep = beforeStep;
	}
}


// 配置整屏切换动画以及每一屏下的动画
miaov.configTimescroll = function(){

	// 解决改变浏览器尺寸页面位置跳回第一页的问题
	var time = miaov.timeScroll ? miaov.timeScroll.time() : 0;
	if( miaov.timeScroll ) miaov.timeScroll.clear();


	miaov.timeScroll = new TimelineMax();

		miaov.timeScroll.add('step1');

	// 第二屏
	miaov.timeScroll.to('.scene2',0.8,{
		top:0,
		ease:Cubic.easeInOut
	});
		miaov.timeScroll.add('step2');


	// 第三屏
	miaov.timeScroll.to('.scene3',0.8,{
		top:0,
		ease:Cubic.easeInOut
	});
		miaov.timeScroll.add('step3');


	// 第四屏
	miaov.timeScroll.to('.scene4',0.8,{
		top:0,
		ease:Cubic.easeInOut
	});
		miaov.timeScroll.add('step4');


	// 第五屏
	miaov.timeScroll.to('.scene5',0.8,{
		top:0,
		ease:Cubic.easeInOut
	});
		miaov.timeScroll.add('step5');

	miaov.timeScroll.stop();

	// 解决改变浏览器尺寸页面位置跳回第一页的问题
	miaov.timeScroll.seek(time);

}




// 配置导航条及首屏的动画
miaov.configIntAnimate = function(){

	var initAnimate = new TimelineMax();

	initAnimate.to('.menu',0.5,{ opacity:1 });
	initAnimate.to('.menu',0.5,{ left:22 },'-=0.3');
	initAnimate.to('.nav',0.5,{ opacity:1 });

	// 设置首屏动画
	initAnimate.to('.scene1_logo',.5,{ opacity:1 });
	initAnimate.staggerTo('.scene1_1 img',2,{
		opacity:1,
		rotationX:0,
		ease:Elastic.easeOut
	},.2);
	initAnimate.to('.light_left',.7,{
		rotationZ:0,
		ease:Cubic.easeOut
	},'-=2');
	initAnimate.to('.light_right',.7,{
		rotationZ:0,
		ease:Cubic.easeOut
	},'-=2');
	initAnimate.to('.controls',.7,{
		bottom:20,
		opacity:1
	},'-=0.7');



	initAnimate.to('body',0,{overflowY:'scroll'});
	$('body').height(8500);

};


// 导航条中的动画
miaov.nav = function(){

	var navAnimate = new TimelineMax();

	$('.nav a').bind('mouseenter',function(){
		var w = $(this).width();
		var l = $(this).offset().left;

		navAnimate.clear();
		navAnimate.to('.line',.4,{
			opacity:1,
			left:l,
			width:w
		});

	});

	$('.nav a').bind('mouseleave',function(){
	
		navAnimate.clear();
		navAnimate.to('.line',.4,{ opacity:0 });

	});


	var languageAnimate = new TimelineMax();

	$('.language').bind('mouseenter',function(){

		languageAnimate.clear();
		languageAnimate.to('.dropdown',.5,{
			opacity:1,
			display:'block'
		});

	});


	$('.language').bind('mouseleave',function(){

		languageAnimate.clear();
		languageAnimate.to('.dropdown',.5,{
			opacity:0,
			display:'none'
		});

	});


	// 调出左侧的导航条
	
	$('.btn_mobile').click(function(){
		var m_aimate = new TimelineMax();
		m_aimate.to('.left_nav',.5,{ left:0 });
	});

	$('.l_close').click(function(){
		var l_aimate = new TimelineMax();
		l_aimate.to('.left_nav',.5,{ left:-300 });
	});


};


// 3D翻转效果
miaov.button3D = function(obj,ele1,ele2,d){

	var button3DAnimate = new TimelineMax();

	button3DAnimate.to( $(obj).find(ele1),0,{
		rotationX:0,
		transformPerspective:600,
		transformOrigin:'center bottom'
	});
	button3DAnimate.to( $(obj).find(ele2),0,{
		rotationX:-90,
		tranformPerspective:600,
		transformOrigin:'top center'
	});



	$(obj).bind('mouseenter',function(){

		var enterAnimate = new TimelineMax();

		var e1 = $(this).find(ele1);
		var e2 = $(this).find(ele2);

		enterAnimate.to(e1,d,{
			rotationX:90,
			top:-e1.height(),
			ease:Cubic.easeInOut
		},0);
		enterAnimate.to(e2,d,{
			rotationX:0,
			top:0,
			ease:Cubic.easeInOut
		},0);


	});

	$(obj).bind('mouseleave',function(){

		var leaveAnimate = new TimelineMax();

		var e1 = $(this).find(ele1);
		var e2 = $(this).find(ele2);

		leaveAnimate.to(e1,d,{
			rotationX:0,
			top:0,
			ease:Cubic.easeInOut
		},0);
		leaveAnimate.to(e2,d,{
			rotationX:-90,
			top:e1.height(),
			ease:Cubic.easeInOut
		},0);


	});

};



// 设置每一屏的高度和top值
miaov.resize = function(){

	$('.scene').height( $(window).height() )// 设置每一屏的高度
	$('.scene:not(":first")').css('top',$(window).height());

	// 解决改变浏览器尺寸页面位置跳回第一页的问题
	miaov.configTimescroll();

	if( $(window).width() <= 950 ){
		$('body').addClass('r950');
		$('.menu').css('top',0);
	}else{
		$('body').removeClass('r950');	
		$('.menu').css('top',22);	
	}

};