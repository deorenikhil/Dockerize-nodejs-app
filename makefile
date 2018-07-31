build:
	docker login -u <username> -p <pass>
	docker build -t prateek-project .

upload:
	docker tag prateek-project kathpalya/prateek-project
	docker push kathpalya/prateek-project

run:
	docker run prateek-project