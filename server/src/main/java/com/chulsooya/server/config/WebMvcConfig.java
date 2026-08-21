package com.chulsooya.server.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;

import com.chulsooya.server.support.AdminFeaturePermissionInterceptor;
import com.chulsooya.server.support.CurrentUserResolver;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

	private final CurrentUserResolver currentUserResolver;
	private final AdminFeaturePermissionInterceptor adminFeaturePermissionInterceptor;

	public WebMvcConfig(CurrentUserResolver currentUserResolver,
			AdminFeaturePermissionInterceptor adminFeaturePermissionInterceptor) {
		this.currentUserResolver = currentUserResolver;
		this.adminFeaturePermissionInterceptor = adminFeaturePermissionInterceptor;
	}

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(currentUserResolver);
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(adminFeaturePermissionInterceptor).addPathPatterns("/api/admin/**");
	}
}
