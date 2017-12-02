<!DOCTYPE html>
<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo('charset'); ?>">
		<meta name="viewport" content="width=device-width">
		<title><?php bloginfo('name'); ?></title>
		<?php wp_head(); ?> <!-- 나중에 Wordpress Plugin 사용할 때를 위해 삽입!-->
	</head>
	
<body <?php body_class(); ?>>
	<div class ="container">

		<!-- site header -->
		<header class="site-header">
			<h1><a href="<?php echo home_url(); ?>"> <?php bloginfo('name'); ?> </a></h1>
			<h5><?php bloginfo('description'); ?></h5>

			<h6>고려대학교 정보기술경영학회 ITS
세상을 바꿀 IT 기술탐구와 그 가치를 더욱 빛나게 할
경영학적 지식의 결합, 정보기술경영학회 ITS가 만들어갑니다. </h6>

		</header> <!-- /site-header -->
