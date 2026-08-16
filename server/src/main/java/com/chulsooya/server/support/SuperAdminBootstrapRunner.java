package com.chulsooya.server.support;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.chulsooya.server.domain.user.UserRepository;

@Configuration
public class SuperAdminBootstrapRunner {
    @Bean
    @ConditionalOnProperty(name = "app.bootstrap.super-admin-email")
    ApplicationRunner superAdminBootstrap(UserRepository users,
            @Value("${app.bootstrap.super-admin-email}") String email) {
        return args -> promote(users, email);
    }

    void promote(UserRepository users, String email) {
        users.findByEmail(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
            user.grantAdministratorForBootstrap();
            users.save(user);
        });
    }
}
