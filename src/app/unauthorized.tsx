import { StatusPage } from '@/components/shared/status-page';

export default function Unauthorized() {
	return <StatusPage status={401} />;
}
