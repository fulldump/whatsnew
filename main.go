package main

import (
	"encoding/json"
	"net/http"
)

func main() {

	s := &http.Server{
		Addr: ":8080",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			json.NewEncoder(w).Encode(map[string]interface{}{
				"hello": "world",
				"v":     3,
			})

		}),
	}

	s.ListenAndServe()

}
