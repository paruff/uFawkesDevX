package com.example.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@SpringBootApplication
@RestController
public class Application {

    @GetMapping("/")
    public Map<String, String> index() {
        return Map.of("message", "{{ cookiecutter.project_name }} is running");
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
