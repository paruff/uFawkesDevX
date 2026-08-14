package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"message": "{{ cookiecutter.project_name }} is running"})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, body map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(body)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/health", healthHandler)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
