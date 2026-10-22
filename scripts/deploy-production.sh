#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

target_sha="${1:-}"
run_reference="${2:-manual}"

if [[ ! "$target_sha" =~ ^[0-9a-f]{40}$ ]]; then
	echo 'The deployment target must be a full Git commit SHA.' >&2
	exit 2
fi

if [[ ! "$run_reference" =~ ^[A-Za-z0-9._-]+$ ]]; then
	echo 'The deployment run reference contains unsupported characters.' >&2
	exit 2
fi

if [[ "$(id -un)" != 'mucyora' ]]; then
	echo 'Run this deployment as the mucyora production user.' >&2
	exit 2
fi

application_root='/var/www/mucyora'
live_repository="$application_root/app/manager"
releases_root="$application_root/releases"
component_releases="$releases_root/manager"
release_id="$(date -u +%Y%m%dT%H%M%SZ)-${target_sha:0:12}-$run_reference"
release_directory="$component_releases/$release_id"
staged_repository="$release_directory/source"
rollback_directory="$release_directory/rollback"
old_commit=''
service_touched=0
promotion_complete=0

install -d -m 750 "$component_releases"
exec 9>"$application_root/.production-deployment.lock"
flock -w 900 9

service_command() {
	sudo -n /usr/bin/systemctl "$@" mucyora-manager
}

wait_for_manager() {
	local attempt

	for attempt in $(seq 1 30); do
		if service_command is-active --quiet &&
			curl --fail --silent --show-error --output /dev/null http://127.0.0.1:3201/login; then
			return 0
		fi
		sleep 2
	done

	return 1
}

cleanup_release_history() {
	local candidate

	for candidate in "$component_releases"/*; do
		[[ -d "$candidate" && "$candidate" != "$release_directory" ]] || continue
		rm -rf -- "$candidate"
	done

	for candidate in "$releases_root"/*; do
		[[ -d "$candidate" ]] || continue
		case "$(basename "$candidate")" in
			db | api | manager) ;;
			*) rm -rf -- "$candidate" ;;
		esac
	done

	git -C "$live_repository" worktree prune
}

restore_previous_runtime() {
	if [[ -d "$rollback_directory/.next" ]]; then
		[[ ! -e "$live_repository/.next" ]] || mv "$live_repository/.next" "$release_directory/failed-next"
		mv "$rollback_directory/.next" "$live_repository/.next"
	fi

	if [[ -d "$rollback_directory/node_modules" ]]; then
		[[ ! -e "$live_repository/node_modules" ]] ||
			mv "$live_repository/node_modules" "$release_directory/failed-node-modules"
		mv "$rollback_directory/node_modules" "$live_repository/node_modules"
	fi

	if [[ -n "$old_commit" ]]; then
		git -C "$live_repository" checkout --detach "$old_commit"
	fi
}

on_exit() {
	local status=$?

	if ((status != 0)); then
		if ((service_touched == 1)); then
			service_command stop || true
			restore_previous_runtime || true
			service_command start || true
			wait_for_manager || true
		fi
		rm -rf -- "$release_directory"
		git -C "$live_repository" worktree prune || true
	elif ((promotion_complete == 1)); then
		cleanup_release_history
	fi

	return "$status"
}
trap on_exit EXIT

if [[ -n "$(git -C "$live_repository" status --porcelain)" ]]; then
	echo 'The production manager repository contains uncommitted files.' >&2
	exit 1
fi

git -C "$live_repository" fetch --prune origin main
git -C "$live_repository" cat-file -e "$target_sha^{commit}"
git -C "$live_repository" merge-base --is-ancestor "$target_sha" origin/main
old_commit="$(git -C "$live_repository" rev-parse HEAD)"

install -d -m 750 "$release_directory"
git -C "$live_repository" worktree add --detach "$staged_repository" "$target_sha"
install -m 600 "$live_repository/.env.production" "$staged_repository/.env.production"

(
	cd "$staged_repository"
	npx --yes npm@10.8.2 ci
	npm run format:check
	npm run lint
	npm run typecheck
	npm test
	npm run build
	test -f .next/BUILD_ID
)

cp -a "$staged_repository/.next" "$live_repository/.next.next-$release_id"
cp -a "$staged_repository/node_modules" "$live_repository/node_modules.next-$release_id"

service_command stop
service_touched=1
git -C "$live_repository" checkout --detach "$target_sha"
install -d -m 750 "$rollback_directory"
mv "$live_repository/.next" "$rollback_directory/.next"
mv "$live_repository/node_modules" "$rollback_directory/node_modules"
mv "$live_repository/.next.next-$release_id" "$live_repository/.next"
mv "$live_repository/node_modules.next-$release_id" "$live_repository/node_modules"
service_command start

wait_for_manager
curl --fail --silent --show-error --output /dev/null https://kdgym.mucyora.rw/login

promotion_complete=1
printf 'Manager application deployed at %s\n' "$target_sha"
