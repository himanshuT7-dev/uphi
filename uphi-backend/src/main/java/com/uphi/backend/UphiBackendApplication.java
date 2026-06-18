package com.uphi.backend;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableCaching
public class UphiBackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure()
			.directory("..")
			.ignoreIfMissing()
			.load();
			
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});

		SpringApplication.run(UphiBackendApplication.class, args);
	}

	@Bean
	public CacheManager cacheManager() {
		return new ConcurrentMapCacheManager("aiSummaries", "aiRisks", "drugInteractions", "aiAlerts");
	}

}
